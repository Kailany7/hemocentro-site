import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Flag,
  MapPin,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Campaign, CollectionLocation } from "../types/public-data";

interface CampanhasSectionProps {
  campaigns: Campaign[];
  locations: CollectionLocation[];
  loading: boolean;
}

export function CampanhasSection({ campaigns, locations, loading }: CampanhasSectionProps) {
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!campanhaSelecionada) return;

    const overflowAnterior = document.body.style.overflow;
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCampanhaSelecionada(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", fecharComEsc);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [campanhaSelecionada]);

  const localDaCampanha = campanhaSelecionada?.local
    ? locations.find((local) => {
        const localCampanha = campanhaSelecionada.local!.trim().toLocaleLowerCase("pt-BR");
        return (
          local.nome.trim().toLocaleLowerCase("pt-BR") === localCampanha ||
          local.endereco.trim().toLocaleLowerCase("pt-BR") === localCampanha
        );
      })
    : undefined;

  return (
    <section id="campanhas" className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[.18em] text-primary">
              Participe
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Campanhas em destaque
            </h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {campaigns.map((campanha) => (
            <button
              type="button"
              key={campanha.id}
              onClick={() => setCampanhaSelecionada(campanha)}
              className="group overflow-hidden rounded-2xl border-2 border-primary/50 bg-card text-left shadow-panel transition-all hover:-translate-y-1 hover:border-primary/75 hover:shadow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Ver detalhes da campanha ${campanha.titulo}`}
            >
              <div className="relative aspect-[1.6] overflow-hidden">
                {campanha.imagem && (
                  <img
                    src={campanha.imagem}
                    alt=""
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 to-transparent" />
                {campanha.data && (
                  <span className="absolute bottom-4 left-4 rounded-full bg-card/90 px-3 py-1.5 text-xs font-bold text-foreground">
                    {campanha.data}
                  </span>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold">{campanha.titulo}</h3>
                {campanha.descricao && (
                  <p className="mt-2 text-sm text-muted-foreground">{campanha.descricao}</p>
                )}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Ver campanha{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          ))}
        </div>
        {!loading && campaigns.length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhuma campanha ativa no momento.
          </p>
        )}
        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando campanhas...
          </p>
        )}
      </div>

      {campanhaSelecionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCampanhaSelecionada(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-dialog-title"
            className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setCampanhaSelecionada(null)}
              className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-card/95 text-foreground shadow-panel transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Fechar detalhes da campanha"
              autoFocus
            >
              <X className="size-5" />
            </button>

            <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
              <div className="flex min-h-64 items-center justify-center bg-secondary/50 p-4 sm:p-6 lg:min-h-[34rem]">
                {campanhaSelecionada.imagem ? (
                  <img
                    src={campanhaSelecionada.imagem}
                    alt={`Imagem da campanha ${campanhaSelecionada.titulo}`}
                    className="max-h-[75vh] size-full object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Esta campanha não possui imagem.
                  </p>
                )}
              </div>

              <div className="p-6 sm:p-8 lg:flex lg:flex-col lg:justify-center">
                <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-primary">
                  Detalhes da campanha
                </p>
                <h3
                  id="campaign-dialog-title"
                  className="pr-10 text-3xl font-extrabold tracking-tight"
                >
                  {campanhaSelecionada.titulo}
                </h3>

                {campanhaSelecionada.descricao && (
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {campanhaSelecionada.descricao}
                  </p>
                )}

                <dl className="mt-7 space-y-3">
                  {(campanhaSelecionada.local ||
                    campanhaSelecionada.endereco ||
                    localDaCampanha?.endereco) && (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                      <MapPin className="size-5 shrink-0 text-primary" />
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {campanhaSelecionada.local ? "Local" : "Endereço"}
                        </dt>
                        {campanhaSelecionada.local && (
                          <dd className="mt-0.5 font-bold">
                            {localDaCampanha?.nome ?? campanhaSelecionada.local}
                          </dd>
                        )}
                        {(campanhaSelecionada.endereco || localDaCampanha?.endereco) && (
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {campanhaSelecionada.endereco || localDaCampanha?.endereco}
                          </dd>
                        )}
                      </div>
                    </div>
                  )}
                  {campanhaSelecionada.horario && (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                      <Clock3 className="size-5 shrink-0 text-primary" />
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Horário
                        </dt>
                        <dd className="mt-0.5 font-bold">{campanhaSelecionada.horario}</dd>
                      </div>
                    </div>
                  )}
                  {campanhaSelecionada.status && (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                      <Flag className="size-5 shrink-0 text-primary" />
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Status
                        </dt>
                        <dd className="mt-0.5 font-bold">{campanhaSelecionada.status}</dd>
                      </div>
                    </div>
                  )}
                  {campanhaSelecionada.meta && (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                      <Target className="size-5 shrink-0 text-primary" />
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Meta
                        </dt>
                        <dd className="mt-0.5 font-bold">{campanhaSelecionada.meta}</dd>
                      </div>
                    </div>
                  )}
                  {campanhaSelecionada.data && (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                      <CalendarDays className="size-5 shrink-0 text-primary" />
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Período
                        </dt>
                        <dd className="mt-0.5 font-bold">{campanhaSelecionada.data}</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
