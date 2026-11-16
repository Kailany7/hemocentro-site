import { CarFront, Clock3, MapPin, Navigation } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LocationMap } from "./LocationMap";
import type { Campaign, CollectionLocation } from "../types/public-data";
import { obterLocaisDasCampanhas } from "../utils/locais-das-campanhas";

function linkDoMapa(endereco: string, cidade = "Campina Grande", estado = "PB") {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [endereco, cidade, estado, "Brasil"].filter(Boolean).join(", "),
  )}`;
}

interface LocaisSectionProps {
  campaigns: Campaign[];
  locations: CollectionLocation[];
  loading: boolean;
}

export function LocaisSection({ campaigns, locations, loading }: LocaisSectionProps) {
  const [localSelecionado, setLocalSelecionado] = useState<CollectionLocation | null>(null);
  const mapaRef = useRef<HTMLDivElement>(null);

  function mostrarNoMapa(local: CollectionLocation) {
    setLocalSelecionado(local);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      mapaRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    }
  }

  const locaisDasCampanhas = useMemo(
    () => obterLocaisDasCampanhas(campaigns, locations),
    [campaigns, locations],
  );

  const locaisDoMapa = useMemo(
    () => [
      ...locations,
      ...locaisDasCampanhas
        .map(({ localDoMapa }) => localDoMapa)
        .filter((localDoMapa) => !locations.some((local) => local.id === localDoMapa.id)),
    ],
    [locaisDasCampanhas, locations],
  );

  return (
    <section id="locais" className="bg-primary-soft/45 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[.18em] text-primary">
            Encontre um local
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Doe perto de você</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          {/* Lista de locais */}
          <div className="flex flex-col gap-3">
            {locaisDasCampanhas.map(({ campanha, endereco, localDoMapa }) => (
              <div
                key={`campanha-${campanha.id}`}
                className={`rounded-2xl border bg-card p-5 shadow-panel ${
                  localSelecionado?.id === localDoMapa.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-primary/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => mostrarNoMapa(localDoMapa)}
                  aria-pressed={localSelecionado?.id === localDoMapa.id}
                  className="flex w-full cursor-pointer items-start gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-bold">{campanha.titulo}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{endereco}</p>
                    {(localDoMapa.horario || campanha.horario) && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success">
                        <Clock3 className="size-3.5" />
                        {localDoMapa.horario || campanha.horario}
                      </p>
                    )}
                    <span className="mt-3 inline-block text-xs font-bold text-primary">
                      Ver no mapa →
                    </span>
                  </div>
                </button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full justify-between rounded-xl bg-secondary/60 text-primary"
                >
                  <a
                    href={linkDoMapa(endereco, localDoMapa.cidade, localDoMapa.estado)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Como chegar <Navigation />
                  </a>
                </Button>
              </div>
            ))}
            {locations.map((local, index) => (
              <div
                key={local.id}
                className={`rounded-2xl border bg-card p-5 shadow-panel ${
                  localSelecionado?.id === local.id
                    ? "border-primary ring-2 ring-primary/20"
                    : index === 0
                      ? "border-primary/40"
                      : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => mostrarNoMapa(local)}
                  aria-pressed={localSelecionado?.id === local.id}
                  className="flex w-full cursor-pointer items-start gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    {local.tipo === "movel" ? (
                      <CarFront className="size-5" />
                    ) : (
                      <MapPin className="size-5" />
                    )}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{local.nome}</h3>
                      {local.tipo === "movel" && (
                        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          Unidade móvel
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{local.endereco}</p>
                    {(typeof local.latitude !== "number" ||
                      typeof local.longitude !== "number") && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sem posição confirmada no mapa
                      </p>
                    )}
                    {local.horario && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success">
                        <Clock3 className="size-3.5" /> {local.horario}
                      </p>
                    )}
                    {local.placa && (
                      <p className="mt-1 text-xs text-muted-foreground">Placa: {local.placa}</p>
                    )}
                    <span className="mt-3 inline-block text-xs font-bold text-primary">
                      Ver no mapa →
                    </span>
                  </div>
                </button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full justify-between rounded-xl bg-secondary/60 text-primary"
                >
                  <a
                    href={linkDoMapa(local.endereco, local.cidade, local.estado)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Como chegar <Navigation />
                  </a>
                </Button>
              </div>
            ))}
            {!loading && locations.length === 0 && (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Nenhum local de coleta foi cadastrado ainda.
              </p>
            )}
            {loading && (
              <p className="text-sm text-muted-foreground" role="status">
                Carregando locais...
              </p>
            )}
          </div>

          <div ref={mapaRef}>
            <LocationMap
              locations={locaisDoMapa}
              selectedLocation={localSelecionado}
              onSelect={setLocalSelecionado}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
