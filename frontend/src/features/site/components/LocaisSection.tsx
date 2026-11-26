import { CarFront, Clock3, Copy, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Campaign, CollectionLocation } from "../types/public-data";
import { obterLocaisDasCampanhas } from "../utils/locais-das-campanhas";
import { linkDoGoogleMaps } from "../utils/google-maps";
import { enderecoParaCopiar } from "../utils/endereco-local";

interface LocaisSectionProps {
  campaigns: Campaign[];
  locations: CollectionLocation[];
  loading: boolean;
}

export function LocaisSection({ campaigns, locations, loading }: LocaisSectionProps) {
  const locaisDasCampanhas = obterLocaisDasCampanhas(campaigns, locations);
  const cards = [
    ...locaisDasCampanhas.map(({ campanha, endereco, localDoMapa }) => ({
      ...localDoMapa,
      id: "campanha-" + campanha.id,
      nome: campanha.titulo,
      endereco,
      horario: campanha.horario || localDoMapa.horario,
      campanha: true,
    })),
    ...locations.map((local) => ({ ...local, campanha: false })),
  ];

  return (
    <section id="locais" className="bg-primary-soft/45 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[.18em] text-primary">
            Encontre um local
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Doe perto de você</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((local) => (
            <article
              key={local.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-panel"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  {local.tipo === "movel" ? (
                    <CarFront className="size-5" />
                  ) : (
                    <MapPin className="size-5" />
                  )}
                </span>
                <div>
                  <h3 className="font-bold">{local.nome}</h3>
                  {(local.campanha || local.tipo === "movel") && (
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {local.campanha ? "Local de campanha" : "Unidade móvel"}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {local.endereco ||
                      (local.cep ? "CEP " + local.cep : "Consulte o local no Google Maps")}
                  </p>
                  {local.horario && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-success">
                      <Clock3 className="size-4 shrink-0" /> {local.horario}
                    </p>
                  )}
                  {local.placa && (
                    <p className="mt-1 text-sm text-muted-foreground">Placa: {local.placa}</p>
                  )}
                </div>
              </div>
              <div className="mt-auto pt-4">
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="min-w-0 flex-1 justify-between rounded-xl bg-secondary/60 px-3 text-primary"
                  >
                    <a href={linkDoGoogleMaps(local)} target="_blank" rel="noopener noreferrer">
                      Google Maps <Navigation />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-0 flex-1 px-2"
                    onClick={async () => {
                      const endereco = enderecoParaCopiar(local);
                      if (!endereco) {
                        toast.error("Endere?o n?o dispon?vel para copiar.");
                        return;
                      }
                      try {
                        await navigator.clipboard.writeText(endereco);
                        toast.success("Endere?o copiado.");
                      } catch {
                        toast.error("N?o foi poss?vel copiar o endere?o neste navegador.");
                      }
                    }}
                  >
                    <Copy /> Copiar
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {!loading && cards.length === 0 && (
            <p className="col-span-full rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhum local de coleta foi cadastrado ainda.
            </p>
          )}
          {loading && (
            <p className="col-span-full text-sm text-muted-foreground" role="status">
              Carregando locais...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
