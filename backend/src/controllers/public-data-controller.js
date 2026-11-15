import { responder } from "../http/http.js";
import {
  obterCampanhas,
  obterEstoque,
  obterLocais,
} from "../services/public-data-service.js";

async function responderComDados(response, operacao) {
  try {
    responder(response, 200, { data: await operacao() });
  } catch (error) {
    console.error(error);
    responder(response, 500, { erro: "Não foi possível consultar os dados no momento." });
  }
}

export function responderEstoques(_request, response) {
  return responderComDados(response, obterEstoque);
}

export function responderCampanhas(_request, response) {
  return responderComDados(response, obterCampanhas);
}

export function responderLocais(_request, response) {
  return responderComDados(response, obterLocais);
}
