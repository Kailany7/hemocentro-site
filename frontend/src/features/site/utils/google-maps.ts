import type { CollectionLocation } from "../types/public-data";

export function linkDoGoogleMaps(
  local: Pick<CollectionLocation, "nome" | "endereco" | "cep" | "cidade" | "estado">,
) {
  const consulta = [
    local.endereco || (!local.cep ? local.nome : ""),
    local.cep,
    local.cidade || "Campina Grande",
    local.estado || "PB",
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(consulta);
}
