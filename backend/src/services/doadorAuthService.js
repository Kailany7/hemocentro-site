import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { env } from "../config/env.js";
import { obterColecao } from "../database/mongodb.js";

const COLECAO = "DoadoresCCadastro";
const COLECAO_CARTEIRAS = "CarteirasUsuarios";
const CUSTO_BCRYPT = 10;
const VALIDADE_TOKEN = "1d";
const CAMPOS_CADASTRO = ["nome", "email", "tipoSanguineo", "senha"];
const CAMPOS_LOGIN = ["email", "senha"];
const CAMPOS_SENHA = ["senhaAtual", "novaSenha"];
const NOTIFICACOES_EMAIL_PADRAO = true;
const TAMANHO_MINIMO_SENHA = 6;
const TAMANHO_MAXIMO_CARTEIRA = 8 * 1024 * 1024;
const TIPOS_CARTEIRA = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_EM_USO = "E-mail já cadastrado. Deseja recuperar a senha?";
const CREDENCIAIS_INVALIDAS = "E-mail ou senha inválidos";
const TELEFONE_INVALIDO = "Telefone inválido. Informe 10 ou 11 dígitos.";
const DOADOR_NAO_ENCONTRADO = "Doador não encontrado.";

function normalizarEmail(email) {
  return String(email).trim().toLowerCase();
}

function apenasDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function camposAusentes(body, campos) {
  return campos.filter((campo) => typeof body?.[campo] !== "string" || body[campo].trim() === "");
}

function opcional(body, campo) {
  const valor = body?.[campo];
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : undefined;
}

// Telefone aceita fixo (10 digitos) ou celular (11 digitos).
function telefoneValido(valor) {
  const digitos = apenasDigitos(valor);
  return digitos.length === 10 || digitos.length === 11;
}

// Formato publico do doador: nunca inclui o senhaHash.
function paraDoadorPublico(documento, carteira = null) {
  return {
    id: String(documento._id),
    nome: documento.nome,
    email: documento.email,
    tipoSanguineo: documento.tipo ?? documento.tipoSanguineo,
    tipoSanguineoVerificado: documento.tipoSanguineoVerificado === true,
    cpf: documento.cpf,
    telefone: documento.telefone,
    status: documento.status,
    notificacoesEmail: documento.notificacoesEmail !== false,
    createdAt: documento.createdAt,
    updatedAt: documento.updatedAt,
    carteira: carteira
      ? {
          url: carteira.url,
          publicId: carteira.publicId,
          resourceType: carteira.resourceType,
          format: carteira.format,
          version: carteira.version,
          fileName: carteira.fileName,
          uploadedAt: carteira.uploadedAt,
        }
      : null,
  };
}

async function buscarCarteiraDoDoador(documento) {
  const colecaoCarteiras = await obterColecao(COLECAO_CARTEIRAS);
  let carteira = await colecaoCarteiras.findOne({ doadorId: documento._id });

  // Migra carteiras salvas antes da criação de CarteirasUsuarios.
  if (!carteira && documento.carteira) {
    const agora = new Date();
    await colecaoCarteiras.updateOne(
      { doadorId: documento._id },
      {
        $setOnInsert: {
          doadorId: documento._id,
          ...documento.carteira,
          createdAt: agora,
          updatedAt: agora,
        },
      },
      { upsert: true },
    );
    carteira = await colecaoCarteiras.findOne({ doadorId: documento._id });
  }

  if (documento.carteira) {
    await (
      await obterColecao(COLECAO)
    ).updateOne({ _id: documento._id }, { $unset: { carteira: "" } });
  }

  return carteira;
}

async function perfilPublico(documento) {
  return paraDoadorPublico(documento, await buscarCarteiraDoDoador(documento));
}

function urlAutenticadaCloudinary(resultado) {
  const url = new URL(resultado.secure_url);
  const partes = url.pathname.split("/");
  const indiceRecurso = partes.findIndex(
    (parte, indice) =>
      parte === resultado.resource_type && ["upload", "authenticated"].includes(partes[indice + 1]),
  );
  if (indiceRecurso < 0) {
    throw new Error("Não foi possível identificar a URL da carteira enviada ao Cloudinary.");
  }

  if (partes[indiceRecurso + 2]?.startsWith("s--")) return url.toString();

  const caminho = partes.slice(indiceRecurso + 2).join("/");
  if (!caminho) {
    throw new Error("A URL da carteira enviada ao Cloudinary está incompleta.");
  }
  const assinatura = createHash("sha1")
    .update(`${caminho}${env.cloudinaryApiSecret}`)
    .digest("base64url")
    .slice(0, 8);
  partes[indiceRecurso + 1] = "authenticated";
  partes.splice(indiceRecurso + 2, 0, `s--${assinatura}--`);
  url.pathname = partes.join("/");
  return url.toString();
}

function arquivoValido(mimeType, buffer) {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (mimeType === "image/jpeg")
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png")
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp")
    return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
}

function assinarParametrosCloudinary(parametros) {
  const stringAssinada = Object.keys(parametros)
    .sort()
    .map((chave) => `${chave}=${parametros[chave]}`)
    .join("&");
  return createHash("sha1").update(`${stringAssinada}${env.cloudinaryApiSecret}`).digest("hex");
}

export async function enviarCarteira(id, body) {
  if (!ObjectId.isValid(id)) return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return {
      status: 503,
      body: { erro: "Configure as credenciais do Cloudinary no arquivo .env." },
    };
  }

  const nomeArquivo = typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  const conteudo = typeof body?.base64 === "string" ? body.base64 : "";
  if (!nomeArquivo || !conteudo || !TIPOS_CARTEIRA.has(mimeType)) {
    return { status: 400, body: { erro: "Envie uma carteira em PDF, JPEG, PNG ou WebP." } };
  }

  const arquivo = Buffer.from(conteudo, "base64");
  if (
    arquivo.length === 0 ||
    arquivo.length > TAMANHO_MAXIMO_CARTEIRA ||
    !arquivoValido(mimeType, arquivo)
  ) {
    return { status: 400, body: { erro: "O arquivo é inválido ou excede o limite de 8 MB." } };
  }

  const colecao = await obterColecao(COLECAO);
  const documento = await colecao.findOne({ _id: new ObjectId(id) });
  if (!documento) return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = String(documento._id);
  const parametros = {
    folder: env.cloudinaryFolder,
    overwrite: "true",
    public_id: publicId,
    timestamp: String(timestamp),
    type: "authenticated",
  };
  const dados = new FormData();
  dados.set("file", `data:${mimeType};base64,${arquivo.toString("base64")}`);
  dados.set("api_key", env.cloudinaryApiKey);
  dados.set("timestamp", String(timestamp));
  dados.set("folder", env.cloudinaryFolder);
  dados.set("public_id", publicId);
  dados.set("overwrite", "true");
  dados.set("type", "authenticated");
  dados.set("signature", assinarParametrosCloudinary(parametros));

  const resposta = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/auto/upload`,
    {
      method: "POST",
      body: dados,
    },
  );
  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok || !resultado.secure_url) {
    console.error("Falha no upload do Cloudinary:", resultado.error?.message ?? resposta.status);
    return {
      status: 502,
      body: { erro: "Não foi possível enviar a carteira ao Cloudinary. Tente novamente." },
    };
  }

  const carteira = {
    url: urlAutenticadaCloudinary(resultado),
    publicId: resultado.public_id,
    resourceType: resultado.resource_type,
    format: resultado.format,
    version: resultado.version,
    fileName: nomeArquivo.slice(0, 160),
    uploadedAt: new Date().toISOString(),
  };
  const agora = new Date();
  await (
    await obterColecao(COLECAO_CARTEIRAS)
  ).updateOne(
    { doadorId: documento._id },
    {
      $set: { ...carteira, updatedAt: agora },
      $setOnInsert: { doadorId: documento._id, createdAt: agora },
    },
    { upsert: true },
  );
  await colecao.updateOne(
    { _id: documento._id },
    { $set: { updatedAt: agora }, $unset: { carteira: "" } },
  );
  return { status: 200, body: paraDoadorPublico({ ...documento, updatedAt: agora }, carteira) };
}

export async function excluirCarteira(id) {
  if (!ObjectId.isValid(id)) return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return {
      status: 503,
      body: { erro: "Configure as credenciais do Cloudinary no arquivo .env." },
    };
  }

  const colecao = await obterColecao(COLECAO);
  const documento = await colecao.findOne({ _id: new ObjectId(id) });
  if (!documento) return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };

  const carteira = await buscarCarteiraDoDoador(documento);
  if (carteira) {
    if (!carteira.publicId || !["image", "raw", "video"].includes(carteira.resourceType)) {
      return {
        status: 500,
        body: { erro: "Os dados da carteira não permitem excluí-la com segurança." },
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const parametros = {
      invalidate: "true",
      public_id: carteira.publicId,
      timestamp: String(timestamp),
      type: "authenticated",
    };
    const dados = new FormData();
    dados.set("public_id", carteira.publicId);
    dados.set("timestamp", String(timestamp));
    dados.set("type", "authenticated");
    dados.set("invalidate", "true");
    dados.set("api_key", env.cloudinaryApiKey);
    dados.set("signature", assinarParametrosCloudinary(parametros));

    let resposta;
    try {
      resposta = await fetch(
        `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/${carteira.resourceType}/destroy`,
        { method: "POST", body: dados },
      );
    } catch {
      return {
        status: 502,
        body: { erro: "Não foi possível conectar ao Cloudinary para excluir a carteira." },
      };
    }
    const resultado = await resposta.json().catch(() => ({}));
    if (!resposta.ok || !["ok", "not found"].includes(resultado.result)) {
      console.error(
        "Falha ao excluir carteira no Cloudinary:",
        resultado.error?.message ?? resultado.result ?? resposta.status,
      );
      return { status: 502, body: { erro: "O Cloudinary não confirmou a exclusão da carteira." } };
    }
  }

  await colecao.updateOne(
    { _id: documento._id },
    { $unset: { carteira: "" }, $set: { updatedAt: new Date() } },
  );
  await (await obterColecao(COLECAO_CARTEIRAS)).deleteOne({ doadorId: documento._id });
  return { status: 200, body: paraDoadorPublico(documento) };
}

function segredoJwt() {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET não foi definida no arquivo .env");
  }
  return env.jwtSecret;
}

function gerarToken(documento) {
  return jwt.sign({ id: String(documento._id) }, segredoJwt(), { expiresIn: VALIDADE_TOKEN });
}

async function buscarPorEmail(email) {
  return (await obterColecao(COLECAO)).findOne({ email });
}

export async function cadastrar(body) {
  const ausentes = camposAusentes(body, CAMPOS_CADASTRO);
  if (ausentes.length) {
    return { status: 400, body: { erro: `Campos obrigatórios ausentes: ${ausentes.join(", ")}.` } };
  }

  if (body.senha.length < TAMANHO_MINIMO_SENHA) {
    return { status: 400, body: { erro: "A senha deve ter no mínimo 6 caracteres." } };
  }

  const email = normalizarEmail(body.email);
  if (!EMAIL_VALIDO.test(email)) {
    return { status: 400, body: { erro: "Informe um e-mail válido." } };
  }

  // O telefone e opcional, mas quando enviado precisa ter 10 ou 11 digitos.
  const telefoneBruto = opcional(body, "telefone");
  if (telefoneBruto !== undefined && !telefoneValido(telefoneBruto)) {
    return { status: 400, body: { erro: TELEFONE_INVALIDO } };
  }
  const telefone = telefoneBruto === undefined ? undefined : apenasDigitos(telefoneBruto);

  const colecao = await obterColecao(COLECAO);
  if (await buscarPorEmail(email)) {
    return { status: 409, body: { erro: EMAIL_EM_USO } };
  }

  const agora = new Date();
  const documento = {
    nome: body.nome.trim(),
    email,
    // O campo do cadastro atual do sistema se chama "tipo" no MongoDB.
    tipo: body.tipoSanguineo.trim(),
    senhaHash: await bcrypt.hash(body.senha, CUSTO_BCRYPT),
    status: "Em triagem",
    // O tipo sanguineo so e confirmado pelo hemocentro na primeira doacao.
    tipoSanguineoVerificado: false,
    // Opt-in por padrão: doadores recebem notificações de campanhas por e-mail.
    notificacoesEmail: NOTIFICACOES_EMAIL_PADRAO,
    createdAt: agora,
    updatedAt: agora,
  };

  if (telefone) documento.telefone = telefone;

  try {
    const resultado = await colecao.insertOne(documento);
    return { status: 201, body: paraDoadorPublico({ _id: resultado.insertedId, ...documento }) };
  } catch (error) {
    // O índice único evita duas contas com o mesmo e-mail no mesmo instante.
    if (error.code === 11000) {
      return { status: 409, body: { erro: EMAIL_EM_USO } };
    }
    throw error;
  }
}

export async function login(body) {
  const ausentes = camposAusentes(body, CAMPOS_LOGIN);
  if (ausentes.length) {
    return { status: 400, body: { erro: `Campos obrigatórios ausentes: ${ausentes.join(", ")}.` } };
  }

  const documento = await buscarPorEmail(normalizarEmail(body.email));
  const senhaConfere =
    documento && documento.senhaHash
      ? await bcrypt.compare(body.senha, documento.senhaHash)
      : false;

  // A mesma mensagem vale para e-mail inexistente e senha errada.
  if (!documento || !senhaConfere) {
    return { status: 401, body: { erro: CREDENCIAIS_INVALIDAS } };
  }

  return {
    status: 200,
    body: { token: gerarToken(documento), doador: await perfilPublico(documento) },
  };
}

export async function buscarDoadorPorId(id) {
  if (!ObjectId.isValid(id)) return null;

  const documento = await (await obterColecao(COLECAO)).findOne({ _id: new ObjectId(id) });
  return documento ? perfilPublico(documento) : null;
}

// Atualiza somente nome, email e telefone. Qualquer outro campo enviado e ignorado.
export async function atualizarPerfil(id, body) {
  if (!ObjectId.isValid(id)) {
    return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };
  }

  const colecao = await obterColecao(COLECAO);
  const documento = await colecao.findOne({ _id: new ObjectId(id) });
  if (!documento) {
    return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };
  }

  const alteracoes = {};
  let removerTelefone = false;

  if (body?.nome !== undefined) {
    if (typeof body.nome !== "string" || body.nome.trim() === "") {
      return { status: 400, body: { erro: "Informe seu nome." } };
    }
    alteracoes.nome = body.nome.trim();
  }

  if (body?.email !== undefined) {
    const email = normalizarEmail(body.email);
    if (!EMAIL_VALIDO.test(email)) {
      return { status: 400, body: { erro: "Informe um e-mail válido." } };
    }

    const emailEmUso = await colecao.findOne({ email, _id: { $ne: documento._id } });
    if (emailEmUso) return { status: 409, body: { erro: EMAIL_EM_USO } };

    alteracoes.email = email;
  }

  if (body?.telefone !== undefined) {
    const vazio =
      body.telefone === null || (typeof body.telefone === "string" && body.telefone.trim() === "");

    if (vazio) {
      // Telefone em branco remove o campo.
      removerTelefone = true;
    } else if (typeof body.telefone !== "string" || !telefoneValido(body.telefone)) {
      return { status: 400, body: { erro: TELEFONE_INVALIDO } };
    } else {
      alteracoes.telefone = apenasDigitos(body.telefone);
    }
  }

  // Preferência de notificações por e-mail (opcional, booleano).
  if (body?.notificacoesEmail !== undefined) {
    if (typeof body.notificacoesEmail !== "boolean") {
      return {
        status: 400,
        body: { erro: "O campo notificacoesEmail deve ser verdadeiro ou falso." },
      };
    }
    alteracoes.notificacoesEmail = body.notificacoesEmail;
  }

  if (Object.keys(alteracoes).length === 0 && !removerTelefone) {
    return {
      status: 400,
      body: { erro: "Envie ao menos um campo: nome, email, telefone ou notificacoesEmail." },
    };
  }

  alteracoes.updatedAt = new Date();

  const atualizacao = { $set: alteracoes };
  if (removerTelefone) atualizacao.$unset = { telefone: "" };

  try {
    const atualizado = await colecao.findOneAndUpdate({ _id: documento._id }, atualizacao, {
      returnDocument: "after",
    });
    if (!atualizado) return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };
    return { status: 200, body: await perfilPublico(atualizado) };
  } catch (error) {
    if (error.code === 11000) return { status: 409, body: { erro: EMAIL_EM_USO } };
    throw error;
  }
}

// Troca a senha exigindo a senha atual, para proteger a conta de quem pegou o token.
export async function alterarSenha(id, body) {
  const ausentes = camposAusentes(body, CAMPOS_SENHA);
  if (ausentes.length) {
    return { status: 400, body: { erro: `Campos obrigatórios ausentes: ${ausentes.join(", ")}.` } };
  }

  if (body.novaSenha.length < TAMANHO_MINIMO_SENHA) {
    return { status: 400, body: { erro: "A senha deve ter no mínimo 6 caracteres." } };
  }

  if (!ObjectId.isValid(id)) {
    return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };
  }

  const colecao = await obterColecao(COLECAO);
  const documento = await colecao.findOne({ _id: new ObjectId(id) });
  if (!documento) {
    return { status: 404, body: { erro: DOADOR_NAO_ENCONTRADO } };
  }

  const senhaConfere = documento.senhaHash
    ? await bcrypt.compare(body.senhaAtual, documento.senhaHash)
    : false;

  if (!senhaConfere) {
    return { status: 401, body: { erro: "Senha atual incorreta." } };
  }

  await colecao.updateOne(
    { _id: documento._id },
    {
      $set: {
        senhaHash: await bcrypt.hash(body.novaSenha, CUSTO_BCRYPT),
        updatedAt: new Date(),
      },
    },
  );

  return { status: 200, body: { mensagem: "Senha alterada com sucesso." } };
}
