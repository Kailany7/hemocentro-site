import { randomUUID } from "node:crypto";
import {
  listarCampanhas,
  listarEstoque,
  listarLocais,
} from "../repositories/public-data-repository.js";
import { geocodificarEndereco } from "./geocoding-service.js";

function texto(documento, ...campos) {
  for (const campo of campos) {
    const valor = documento[campo];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }

  return "";
}

function numero(documento, ...campos) {
  for (const campo of campos) {
    if (documento[campo] === null || documento[campo] === undefined || documento[campo] === "") {
      continue;
    }
    const valor = Number(documento[campo]);
    if (Number.isFinite(valor)) return valor;
  }

  return undefined;
}

function objeto(documento, campo) {
  const valor = documento[campo];
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
}

function enderecoDaUnidadeMovel(documento) {
  const endereco = objeto(documento, "endereco");
  const rua =
    texto(documento, "rua", "logradouro", "endereco") ||
    texto(endereco, "rua", "logradouro", "endereco");
  const bairro = texto(documento, "bairro") || texto(endereco, "bairro");

  return bairro &&
    !rua.toLocaleLowerCase("pt-BR").includes(bairro.toLocaleLowerCase("pt-BR"))
    ? [rua, bairro].filter(Boolean).join(", ")
    : rua || bairro;
}

function coordenadasDoLocal(documento) {
  for (const origem of [
    documento,
    objeto(documento, "localizacao"),
    objeto(documento, "coordenadas"),
  ]) {
    const latitude = numero(origem, "latitude", "lat");
    const longitude = numero(origem, "longitude", "lng", "lon");
    if (
      latitude !== undefined &&
      Math.abs(latitude) <= 90 &&
      longitude !== undefined &&
      Math.abs(longitude) <= 180
    ) {
      return { latitude, longitude };
    }
  }

  return { latitude: undefined, longitude: undefined };
}

function id(documento) {
  return documento._id?.toString() ?? randomUUID();
}

function tomDoEstoque(status, porcentagem) {
  const normalizado = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/critico|emergencia|indisponivel/.test(normalizado) || porcentagem <= 20) return "critico";
  if (/baixo|alerta/.test(normalizado) || porcentagem <= 45) return "baixo";
  return "estavel";
}

function rotuloDoNivel(tom) {
  return tom === "critico" ? "Crítico" : tom === "baixo" ? "Baixo" : "Estável";
}

function paraDataIso(valor) {
  if (!valor) return undefined;
  const data = valor instanceof Date ? valor : new Date(String(valor));
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString();
}

function periodo(documento) {
  const explicito = texto(documento, "data", "periodo", "dataFormatada");
  if (explicito) return explicito;

  const inicio = texto(documento, "dataInicio", "inicio");
  const fim = texto(documento, "dataFim", "fim");

  if (inicio && fim && inicio !== fim) return `${inicio} a ${fim}`;
  return inicio || fim;
}

function faixaDeHorario(documento) {
  const explicito = texto(
    documento,
    "horario",
    "horário",
    "horarioFuncionamento",
    "horarioAtendimento",
  );
  if (explicito) return explicito;

  const inicio = texto(documento, "horarioInicio", "horaInicio");
  const fim = texto(documento, "horarioFim", "horaFim");

  if (inicio && fim && inicio !== fim) return `${inicio} às ${fim}`;
  return inicio || fim;
}

function enderecoDaCampanha(documento) {
  const aninhado = documento.endereco;
  const camposDeEndereco =
    aninhado && typeof aninhado === "object" && !Array.isArray(aninhado) ? aninhado : documento;
  const rua = texto(documento, "rua", "logradouro") || texto(camposDeEndereco, "rua", "logradouro");
  const bairro = texto(documento, "bairro") || texto(camposDeEndereco, "bairro");
  const endereco = texto(documento, "endereco") || texto(camposDeEndereco, "endereco") || rua;

  if (!endereco) return bairro;
  if (
    !bairro ||
    endereco.toLocaleLowerCase("pt-BR").includes(bairro.toLocaleLowerCase("pt-BR"))
  ) {
    return endereco;
  }
  return `${endereco}, ${bairro}`;
}

function inicioDaCampanha(documento) {
  const valor = documento.dataInicio ?? documento.inicio ?? documento.createdAt;
  if (valor instanceof Date) return valor.getTime();
  if (typeof valor !== "string") return Number.POSITIVE_INFINITY;

  const dataBrasileira = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dataBrasileira) {
    const [, dia, mes, ano] = dataBrasileira;
    return Date.UTC(Number(ano), Number(mes) - 1, Number(dia));
  }

  const timestamp = Date.parse(valor);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export async function obterEstoque() {
  const documentos = await listarEstoque();

  return documentos.flatMap((documento) => {
    const tipo = texto(documento, "tipo", "nome", "tipoSanguineo");
    if (!tipo) return [];

    const valor = Math.min(100, Math.max(0, numero(documento, "porcentagem", "valor", "nivel") ?? 0));
    const status = texto(documento, "status", "situacao");
    const tom = tomDoEstoque(status, valor);

    return [
      {
        id: id(documento),
        tipo,
        valor,
        tom,
        nivel: status || rotuloDoNivel(tom),
        unidade: texto(documento, "unidade", "local") || undefined,
        atualizadoEm: paraDataIso(documento.updatedAt ?? documento.createdAt),
      },
    ];
  });
}

export async function obterCampanhas() {
  const documentos = await listarCampanhas();

  const campanhas = documentos
    .flatMap((documento) => {
      const titulo = texto(documento, "titulo", "nome");
      if (!titulo) return [];

      return [
        {
          id: id(documento),
          titulo,
          descricao: texto(documento, "descricao", "description"),
          data: periodo(documento),
          local: texto(documento, "local", "localNome", "unidade") || undefined,
          endereco: enderecoDaCampanha(documento) || undefined,
          horario: faixaDeHorario(documento) || undefined,
          imagem: texto(documento, "imagem", "imagemUrl", "imageUrl", "urlImagem"),
          meta: texto(documento, "meta", "objetivo") || undefined,
          status: texto(documento, "status", "situacao") || undefined,
          atualizadoEm: paraDataIso(documento.updatedAt ?? documento.createdAt),
          latitude: numero(documento, "latitude", "lat"),
          longitude: numero(documento, "longitude", "lng", "lon"),
          cidade: texto(documento, "cidade", "municipio") || undefined,
          estado: texto(documento, "estado", "uf") || undefined,
          _inicio: inicioDaCampanha(documento),
        },
      ];
    })
    .sort((a, b) => a._inicio - b._inicio);

  return Promise.all(
    campanhas.map(async ({ _inicio, cidade, estado, ...campanha }) => {
      if (
        campanha.latitude !== undefined &&
        campanha.longitude !== undefined &&
        Math.abs(campanha.latitude) <= 90 &&
        Math.abs(campanha.longitude) <= 180
      ) {
        return campanha;
      }
      if (!campanha.endereco) return campanha;

      const posicao = await geocodificarEndereco(
        campanha.endereco,
        cidade || "Campina Grande",
        estado || "PB",
      );
      return posicao ? { ...campanha, ...posicao, positionApproximate: true } : campanha;
    }),
  );
}

export async function obterLocais() {
  const documentos = await listarLocais();

  const locais = documentos.flatMap((documento) => {
    const movel = documento.__movel === true;
    const nome = texto(documento, "nome", "titulo");
    if (!nome) return [];

    const endereco = objeto(documento, "endereco");
    const coordenadas = coordenadasDoLocal(documento);

    return [
      {
        id: `${movel ? "movel-" : ""}${id(documento)}`,
        nome,
        endereco: movel
          ? enderecoDaUnidadeMovel(documento)
          : texto(documento, "endereco", "endereço", "logradouro"),
        horario: faixaDeHorario(documento),
        tipo: movel ? "movel" : "fixo",
        status: texto(documento, "status", "situacao") || undefined,
        placa: movel ? texto(documento, "placa") || undefined : undefined,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
        cidade:
          texto(documento, "cidade", "municipio") ||
          texto(endereco, "cidade", "municipio") ||
          undefined,
        estado: texto(documento, "estado", "uf") || texto(endereco, "estado", "uf") || undefined,
      },
    ];
  });

  return Promise.all(
    locais.map(async (local) => {
      if (
        local.latitude !== undefined &&
        local.longitude !== undefined &&
        Math.abs(local.latitude) <= 90 &&
        Math.abs(local.longitude) <= 180
      ) {
        return local;
      }

      if (!local.endereco) return local;

      const posicao = await geocodificarEndereco(
        local.endereco,
        local.cidade || "Campina Grande",
        local.estado || "PB",
      );
      return posicao ? { ...local, ...posicao, positionApproximate: true } : local;
    }),
  );
}
