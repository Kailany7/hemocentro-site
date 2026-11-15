import {
  responderCampanhas,
  responderEstoques,
  responderLocais,
} from "../controllers/public-data-controller.js";
import { responder } from "../http/http.js";

const CAMINHOS = Object.freeze({
  "/api/estoques": responderEstoques,
  "/api/campanhas": responderCampanhas,
  "/api/locais": responderLocais,
});

export const CAMINHOS_DADOS_PUBLICOS = Object.freeze(Object.keys(CAMINHOS));

export async function rotearDadosPublicos(request, response, url) {
  const caminho = url.pathname.replace(/\/+$/, "");
  const controlador = CAMINHOS[caminho];

  if (!controlador) {
    responder(response, 404, { erro: "Caminho da API nao encontrado." });
    return;
  }

  if (request.method !== "GET") {
    responder(response, 405, { erro: "Metodo nao permitido." });
    return;
  }

  await controlador(request, response);
}
