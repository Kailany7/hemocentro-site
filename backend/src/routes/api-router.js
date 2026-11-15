import { conectarBanco } from "../database/mongodb.js";
import { responder } from "../http/http.js";
import { rotearDoador } from "./doador-router.js";
import { CAMINHOS_DADOS_PUBLICOS, rotearDadosPublicos } from "./public-data-router.js";

export async function rotearApi(request, response) {
  if (request.method === "OPTIONS") {
    responder(response, 204, null);
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (request.method === "GET" && url.pathname === "/api/health") {
    await conectarBanco();
    responder(response, 200, { status: "ok", banco: "conectado" });
    return;
  }

  // Autenticacao e area do doador (UC06).
  if (url.pathname === "/api/doador" || url.pathname.startsWith("/api/doador/")) {
    await rotearDoador(request, response, url);
    return;
  }

  // Dados publicos da landing page (estoque, campanhas e locais).
  if (CAMINHOS_DADOS_PUBLICOS.includes(url.pathname.replace(/\/+$/, ""))) {
    await rotearDadosPublicos(request, response, url);
    return;
  }

  responder(response, 404, { erro: "Caminho da API nao encontrado." });
}
