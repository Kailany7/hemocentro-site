import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

const client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
let databasePromise;

// Colecoes usadas pela area do doador e pelos dados publicos da landing page.
const colecoes = Object.freeze([
  "DoadoresCCadastro",
  "CarteirasUsuarios",
  "EstoqueSangue",
  "Campanhas",
  "LocaisColeta",
  "UnidadesMoveis",
  "GeocodingCache",
  "NotificacoesLog",
]);

async function garantirColecoes(database) {
  const colecoesExistentes = new Set(
    (await database.listCollections({}, { nameOnly: true }).toArray()).map(
      (colecao) => colecao.name,
    ),
  );

  await Promise.all(
    colecoes
      .filter((nome) => !colecoesExistentes.has(nome))
      .map(async (nome) => {
        try {
          await database.createCollection(nome);
        } catch (error) {
          // Outro processo pode ter criado a colecao entre a listagem e a criacao.
          if (error.code !== 48) throw error;
        }
      }),
  );
}

// Indices unicos. O filtro parcial ignora documentos antigos que ainda nao tem o campo.
const indicesUnicos = Object.freeze([
  {
    colecao: "DoadoresCCadastro",
    campo: "email",
    opcoes: { unique: true, partialFilterExpression: { email: { $type: "string" } } },
  },
  {
    colecao: "DoadoresCCadastro",
    campo: "cpf",
    opcoes: { unique: true, partialFilterExpression: { cpf: { $type: "string" } } },
  },
  {
    colecao: "CarteirasUsuarios",
    campo: "doadorId",
    opcoes: { unique: true },
  },
  {
    // Garante que cada doador só receba uma notificação por campanha.
    colecao: "NotificacoesLog",
    campo: "campanhaId_doadorId",
    opcoes: { unique: true, partialFilterExpression: { status: "enviado" } },
  },
]);

async function garantirIndicesUnicos(database) {
  await Promise.all(
    indicesUnicos.map(({ colecao, campo, opcoes }) => {
      // Índice composto: campo no formato "a_b" vira { a: 1, b: 1 }.
      const chaves = campo.includes("_") && campo !== "_id"
        ? Object.fromEntries(campo.split("_").map((c) => [c, 1]))
        : { [campo]: 1 };
      return database.collection(colecao).createIndex(chaves, opcoes);
    }),
  );
}

export async function conectarBanco() {
  if (!databasePromise) {
    databasePromise = client
      .connect()
      .then(() => client.db(env.mongoDatabase))
      .then(async (database) => {
        await garantirColecoes(database);
        await garantirIndicesUnicos(database);
        return database;
      });
  }

  try {
    return await databasePromise;
  } catch (error) {
    databasePromise = undefined;
    throw new Error(
      `Nao foi possivel conectar ao MongoDB. Verifique MONGODB_URI, MONGODB_DB e o IP liberado no Atlas. Detalhe: ${error.message}`,
    );
  }
}

export async function obterColecao(nome) {
  return (await conectarBanco()).collection(nome);
}

export async function fecharBanco() {
  await client.close();
  databasePromise = undefined;
}
