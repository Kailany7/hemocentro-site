// Dados de exemplo usados apenas onde a API ainda não expõe informação real.
import type { Doador } from "@/features/auth/doador-auth-service";

export type DoadorExemplo = {
  nome: string;
  email: string;
  tipoSanguineo: string;
  ultimaDoacao: string;
  proximaDoacaoPossivel: string;
  totalDoacoes: number;
};

export const doadorExemplo: DoadorExemplo = {
  nome: "Marina Alves",
  email: "marina.alves@email.com",
  tipoSanguineo: "O-",
  ultimaDoacao: "12 de junho de 2026",
  proximaDoacaoPossivel: "12 de setembro de 2026",
  totalDoacoes: 7,
};

// Usa nome, e-mail e tipo sanguíneo reais do perfil, mantendo os dados de doação
// ainda ilustrativos até a API expor o histórico.
export function doadorComDadosReais(doador: Doador | null): DoadorExemplo {
  return {
    ...doadorExemplo,
    nome: doador?.nome.trim() || "Doador",
    email: doador?.email || "Não informado",
    tipoSanguineo: doador?.tipoSanguineo || "A confirmar",
  };
}
