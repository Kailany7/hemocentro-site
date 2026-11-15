export type StockTone = "estavel" | "baixo" | "critico";

export interface StockItem {
  id: string;
  tipo: string;
  nivel: string;
  valor: number;
  tom: StockTone;
  unidade?: string;
  atualizadoEm?: string;
}

export interface Campaign {
  id: string;
  imagem: string;
  data: string;
  titulo: string;
  descricao: string;
  local?: string;
  endereco?: string;
  horario?: string;
  meta?: string;
  status?: string;
  atualizadoEm?: string;
  latitude?: number;
  longitude?: number;
  positionApproximate?: boolean;
}

export interface CollectionLocation {
  id: string;
  nome: string;
  endereco: string;
  horario: string;
  tipo: "fixo" | "movel";
  status?: string;
  placa?: string;
  latitude?: number;
  longitude?: number;
  cidade?: string;
  estado?: string;
  positionApproximate?: boolean;
}
