import type { CollectionLocation } from "../types/public-data";

export function enderecoParaCopiar(
  local: Pick<CollectionLocation, "endereco" | "cep" | "cidade" | "estado">,
) {
  return [local.endereco, local.cep ? `CEP ${local.cep}` : "", local.cidade, local.estado, "Brasil"]
    .filter(Boolean)
    .join(", ");
}
