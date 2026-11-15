import type { Campaign, CollectionLocation, StockItem } from "../types/public-data";

const apiBaseUrl = (import.meta.env["VITE_API_URL"] ?? "http://localhost:3002/api").replace(
  /\/$/,
  "",
);

async function requisicao<T>(caminho: string, signal?: AbortSignal): Promise<T> {
  const init: RequestInit = { headers: { Accept: "application/json" } };
  if (signal) init.signal = signal;

  const resposta = await fetch(`${apiBaseUrl}${caminho}`, init);

  if (!resposta.ok) {
    throw new Error(`A API respondeu com status ${resposta.status}.`);
  }

  const corpo = (await resposta.json()) as { data: T };
  return corpo.data;
}

export const dadosPublicosApi = {
  estoques: (signal?: AbortSignal) => requisicao<StockItem[]>("/estoques", signal),
  campanhas: (signal?: AbortSignal) => requisicao<Campaign[]>("/campanhas", signal),
  locais: (signal?: AbortSignal) => requisicao<CollectionLocation[]>("/locais", signal),
};
