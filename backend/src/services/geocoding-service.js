import { createHash } from "node:crypto";
import { obterColecao } from "../database/mongodb.js";

const COLECAO = "GeocodingCache";
const VERSAO_CACHE = "2";
const DURACAO_CACHE_NEGATIVO_MS = 24 * 60 * 60 * 1000;
const INTERVALO_MINIMO_MS = 1100;

const pendentes = new Map();
let fila = Promise.resolve();
let proximaRequisicaoEm = 0;

function normalizar(valor) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nomeDaRua(endereco) {
  return normalizar(endereco.split(/[,-]/)[0].replace(/\b(s\/?n|sem numero|\d+)\b/gi, "")).replace(
    /^(rua|r|avenida|av|travessa|tv)\s+/,
    "",
  );
}

async function buscar(endereco, cidade, estado) {
  const rua = nomeDaRua(endereco);
  const bairro = normalizar(endereco.split(",")[1]?.trim() || "");
  if (rua.length < 8 || (!cidade && bairro.length < 4)) return undefined;

  const consulta = [endereco, cidade, estado, "Brasil"].filter(Boolean).join(", ");
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: consulta,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "br",
    limit: "5",
  }).toString();

  const resultado = await new Promise((resolve, reject) => {
    const tarefa = fila.then(async () => {
      const espera = Math.max(0, proximaRequisicaoEm - Date.now());
      if (espera) await new Promise((concluir) => setTimeout(concluir, espera));
      proximaRequisicaoEm = Date.now() + INTERVALO_MINIMO_MS;
      const resposta = await fetch(url, {
        headers: {
          "User-Agent": "HemoHelpSite/1.0 (location map)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!resposta.ok) throw new Error(`Geocoding respondeu com ${resposta.status}`);
      return resposta.json();
    });
    fila = tarefa.then(
      () => undefined,
      () => undefined,
    );
    tarefa.then(resolve, reject);
  });

  const encontrados = resultado.filter((lugar) => {
    const logradouro = lugar.address?.road ? nomeDaRua(lugar.address.road) : "";
    const cidadeEncontrada =
      lugar.address?.city || lugar.address?.town || lugar.address?.municipality || "";
    const bairroEncontrado = normalizar(lugar.address?.suburb || lugar.address?.neighbourhood || "");
    const estadoEncontrado = normalizar(lugar.address?.state || "");
    const estadoEsperado = normalizar(estado || "");
    const estadoConfere =
      !estado ||
      estadoEncontrado === estadoEsperado ||
      (estadoEsperado === "pb" && estadoEncontrado === "paraiba");
    return (
      logradouro.length >= 8 &&
      (logradouro.includes(rua) || rua.includes(logradouro)) &&
      estadoConfere &&
      (cidade ? normalizar(cidadeEncontrada) === normalizar(cidade) : bairroEncontrado === bairro)
    );
  });

  const posicoes = encontrados.map((lugar) => ({
    latitude: Number(lugar.lat),
    longitude: Number(lugar.lon),
    rua: nomeDaRua(lugar.address?.road || ""),
  }));

  if (
    posicoes.length === 0 ||
    posicoes.some(
      (posicao) => !Number.isFinite(posicao.latitude) || !Number.isFinite(posicao.longitude),
    )
  ) {
    return undefined;
  }

  if (posicoes.length > 1) {
    // Uma rua pode retornar vários trechos. Só aproximamos a posição quando
    // todos os resultados são da mesma rua e ficam no mesmo quarteirão.
    const primeira = posicoes[0];
    if (posicoes.some((posicao) => posicao.rua !== primeira.rua)) return undefined;

    const distancia = (a, b) => {
      const diferencaLatitude = (a.latitude - b.latitude) * 111_000;
      const diferencaLongitude =
        (a.longitude - b.longitude) * 111_000 * Math.cos((a.latitude * Math.PI) / 180);
      return Math.hypot(diferencaLatitude, diferencaLongitude);
    };

    if (posicoes.some((a) => posicoes.some((b) => distancia(a, b) > 300))) return undefined;
  }

  return {
    latitude: posicoes.reduce((soma, posicao) => soma + posicao.latitude, 0) / posicoes.length,
    longitude: posicoes.reduce((soma, posicao) => soma + posicao.longitude, 0) / posicoes.length,
  };
}

export function geocodificarEndereco(endereco, cidade, estado) {
  const chave = createHash("sha256")
    .update(`${VERSAO_CACHE}: ${normalizar([endereco, cidade, estado].filter(Boolean).join(", "))}`)
    .digest("hex");

  const emAndamento = pendentes.get(chave);
  if (emAndamento) return emAndamento;

  const resultado = (async () => {
    const colecao = await obterColecao(COLECAO);
    const cacheado = await colecao.findOne({ _id: chave });
    if (cacheado && cacheado.latitude !== null && cacheado.longitude !== null) {
      return { latitude: cacheado.latitude, longitude: cacheado.longitude };
    }
    if (cacheado && Date.now() - cacheado.updatedAt.getTime() < DURACAO_CACHE_NEGATIVO_MS) {
      return undefined;
    }

    try {
      const posicao = await buscar(endereco, cidade, estado);
      await colecao.updateOne(
        { _id: chave },
        {
          $set: {
            latitude: posicao?.latitude ?? null,
            longitude: posicao?.longitude ?? null,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      return posicao;
    } catch (error) {
      console.error("Não foi possível localizar o endereço no mapa:", error);
      return undefined;
    }
  })();

  pendentes.set(chave, resultado);
  void resultado.finally(() => pendentes.delete(chave));
  return resultado;
}
