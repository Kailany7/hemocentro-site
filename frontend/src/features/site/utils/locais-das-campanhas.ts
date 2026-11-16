import type { Campaign, CollectionLocation } from "../types/public-data";

export interface LocalDeCampanha {
  campanha: Campaign;
  endereco: string;
  localDoMapa: CollectionLocation;
}

function normalizar(valor: string) {
  return valor
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function obterLocaisDasCampanhas(
  campaigns: Campaign[],
  locations: CollectionLocation[],
): LocalDeCampanha[] {
  return campaigns.flatMap((campanha) => {
    if (!campanha.local?.trim() && !campanha.endereco?.trim()) return [];

    const localDaCampanha = normalizar(campanha.local || campanha.endereco || "");
    const localEncontrado = locations.find(
      (local) =>
        normalizar(local.nome) === localDaCampanha ||
        normalizar(local.endereco) === localDaCampanha,
    );

    return [
      {
        campanha,
        endereco: campanha.endereco || localEncontrado?.endereco || campanha.local || "",
        localDoMapa:
          localEncontrado ??
          {
            id: `campanha-${campanha.id}`,
            nome: campanha.titulo,
            endereco: campanha.endereco || campanha.local || "",
            horario: campanha.horario || "",
            tipo: "fixo",
            cidade: "Campina Grande",
            estado: "PB",
            ...(campanha.latitude !== undefined ? { latitude: campanha.latitude } : {}),
            ...(campanha.longitude !== undefined ? { longitude: campanha.longitude } : {}),
            ...(campanha.positionApproximate !== undefined
              ? { positionApproximate: campanha.positionApproximate }
              : {}),
          } satisfies CollectionLocation,
      },
    ];
  });
}
