import type {
  Campaign,
  CollectionLocation,
  StockItem,
} from "../types/public-data";

// Dados fixos usados quando a API publica nao responde.
export const ESTOQUE_FIXO: StockItem[] = [
  { id: "fixo-a-positivo", tipo: "A+", nivel: "Estável", valor: 76, tom: "estavel" },
  { id: "fixo-a-negativo", tipo: "A-", nivel: "Baixo", valor: 39, tom: "baixo" },
  { id: "fixo-b-positivo", tipo: "B+", nivel: "Estável", valor: 68, tom: "estavel" },
  { id: "fixo-b-negativo", tipo: "B-", nivel: "Crítico", valor: 18, tom: "critico" },
  { id: "fixo-ab-positivo", tipo: "AB+", nivel: "Estável", valor: 82, tom: "estavel" },
  { id: "fixo-ab-negativo", tipo: "AB-", nivel: "Baixo", valor: 32, tom: "baixo" },
  { id: "fixo-o-positivo", tipo: "O+", nivel: "Baixo", valor: 44, tom: "baixo" },
  { id: "fixo-o-negativo", tipo: "O-", nivel: "Crítico", valor: 13, tom: "critico" },
];

export const CAMPANHAS_FIXAS: Campaign[] = [
  {
    id: "fixo-uma-doacao",
    imagem: "/landing/campaign-people.png",
    data: "12 a 16 de agosto",
    titulo: "Uma doação, três histórias",
    descricao: "Compartilhe esperança com quem precisa.",
  },
  {
    id: "fixo-sabado",
    imagem: "/landing/campaign-community.png",
    data: "24 de agosto",
    titulo: "Sábado de salvar vidas",
    descricao: "Doe no hemocentro mais perto de você.",
  },
  {
    id: "fixo-unidade-movel",
    imagem: "/landing/campaign-mobile.png",
    data: "03 a 05 de setembro",
    titulo: "HemoHelp na sua cidade",
    descricao: "A unidade móvel está chegando.",
  },
];

export const LOCAIS_FIXOS: CollectionLocation[] = [
  {
    id: "fixo-hemocentro",
    nome: "Hemocentro de Campina Grande",
    endereco: "R. Profa. Eutécia Vital Ribeiro, s/n",
    horario: "Seg a sex, a partir das 7h",
    tipo: "fixo",
    cidade: "Campina Grande",
    estado: "PB",
  },
  {
    id: "fixo-hospital-help",
    nome: "Hospital HELP",
    endereco: "R. Heronides da Costa Cirne, 250, Serrotão",
    horario: "Horário a confirmar",
    tipo: "fixo",
    cidade: "Campina Grande",
    estado: "PB",
  },
  {
    id: "fixo-policlinica-malvinas",
    nome: "Policlínica das Malvinas",
    endereco: "Av. Plínio Lemos, Malvinas",
    horario: "Horário a confirmar",
    tipo: "movel",
    cidade: "Campina Grande",
    estado: "PB",
  },
];
