import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/features/site/components/Header";
import { Hero } from "@/features/site/components/Hero";
import { EstoqueSection } from "@/features/site/components/EstoqueSection";
import { CampanhasSection } from "@/features/site/components/CampanhasSection";
import { LocaisSection } from "@/features/site/components/LocaisSection";
import { CriteriosSection } from "@/features/site/components/CriteriosSection";
import { SobreSection } from "@/features/site/components/SobreSection";
import { Footer } from "@/features/site/components/Footer";
import { usePublicData } from "@/features/site/hooks/use-public-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HemoHelp - Doe sangue, salve vidas" },
      {
        name: "description",
        content: "Encontre locais de doação, acompanhe o estoque e participe das campanhas.",
      },
    ],
  }),
  component: PaginaInicial,
});

function PaginaInicial() {
  const { estoque, campanhas, locais, loading } = usePublicData();
  const ultimaAtualizacaoEstoque = estoque.reduce<string | undefined>((maisRecente, item) => {
    if (!item.atualizadoEm || Number.isNaN(Date.parse(item.atualizadoEm))) return maisRecente;

    return !maisRecente || Date.parse(item.atualizadoEm) > Date.parse(maisRecente)
      ? item.atualizadoEm
      : maisRecente;
  }, undefined);

  return (
    <div className="landing flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero atualizadoEm={ultimaAtualizacaoEstoque} />
        <EstoqueSection items={estoque} loading={loading} />
        <CampanhasSection campaigns={campanhas} locations={locais} loading={loading} />
        <LocaisSection campaigns={campanhas} locations={locais} loading={loading} />
        <CriteriosSection />
        <SobreSection />
      </main>
      <Footer />
    </div>
  );
}
