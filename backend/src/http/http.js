const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "Content-Type, Authorization",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

export function responder(response, status, body) {
  response.writeHead(status, headers);
  response.end(body === null ? undefined : JSON.stringify(body));
}

export async function lerBody(request, limiteBytes = 1024 * 1024) {
  const tamanhoDeclarado = Number(request.headers["content-length"] ?? 0);
  if (tamanhoDeclarado > limiteBytes) {
    const erro = new Error("O arquivo excede o limite de 8 MB.");
    erro.status = 413;
    throw erro;
  }
  const partes = [];
  let tamanho = 0;
  for await (const parte of request) {
    tamanho += parte.length;
    if (tamanho > limiteBytes) {
      const erro = new Error("O arquivo excede o limite de 8 MB.");
      erro.status = 413;
      throw erro;
    }
    partes.push(parte);
  }
  if (!partes.length) return {};

  try {
    return JSON.parse(Buffer.concat(partes).toString("utf8"));
  } catch {
    throw new Error("O corpo da requisicao precisa ser um JSON valido.");
  }
}
