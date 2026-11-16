import { Clock3, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Campaign, CollectionLocation } from "@/features/site/types/public-data";
import { obterLocaisDasCampanhas } from "@/features/site/utils/locais-das-campanhas";

function linkDoMapa(local: CollectionLocation) {
  const endereco = [local.endereco, local.cidade, local.estado, "Brasil"]
    .filter(Boolean)
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

function nomeDoTipo(local: CollectionLocation) {
  return local.tipo === "movel" ? "Unidade móvel" : "Hemocentro";
}

interface LocaisColetaProps {
  campanhas: Campaign[];
  locais: CollectionLocation[];
  loading: boolean;
  erro: boolean;
}

export function LocaisColeta({ campanhas, locais, loading, erro }: LocaisColetaProps) {
  const locaisDasCampanhas = obterLocaisDasCampanhas(campanhas, locais);

  return (
    <Card className="border-border shadow-panel">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Locais de coleta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando locais...
          </p>
        )}

        {!loading && erro && (
          <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Não foi possível carregar os locais de coleta agora. Tente novamente mais tarde.
          </p>
        )}

        {!loading && !erro && locais.length === 0 && locaisDasCampanhas.length === 0 && (
          <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Nenhum local de coleta cadastrado no momento.
          </p>
        )}

        {!loading &&
          locaisDasCampanhas.map(({ campanha, endereco, localDoMapa }) => (
            <article
              key={`campanha-${campanha.id}`}
              className="rounded-xl border border-primary/30 bg-secondary/40 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold">{campanha.titulo}</h3>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Local de campanha
                  </p>
                  {endereco && <p className="mt-1 text-sm text-muted-foreground">{endereco}</p>}
                  {(campanha.horario || localDoMapa.horario) && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                      <Clock3 className="size-3.5" />
                      {campanha.horario || localDoMapa.horario}
                    </p>
                  )}
                </div>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-between rounded-xl bg-background text-primary"
              >
                <a href={linkDoMapa(localDoMapa)} target="_blank" rel="noreferrer">
                  Como chegar
                  <Navigation />
                </a>
              </Button>
            </article>
          ))}

        {!loading &&
          !erro &&
          locais.map((local) => (
            <article
              key={local.id}
              className="rounded-xl border border-border bg-secondary/40 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold">{local.nome}</h3>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {nomeDoTipo(local)}
                  </p>
                  {local.endereco && (
                    <p className="mt-1 text-sm text-muted-foreground">{local.endereco}</p>
                  )}
                  {local.horario && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                      <Clock3 className="size-3.5" />
                      {local.horario}
                    </p>
                  )}
                </div>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-between rounded-xl bg-background text-primary"
              >
                <a href={linkDoMapa(local)} target="_blank" rel="noreferrer">
                  Como chegar
                  <Navigation />
                </a>
              </Button>
            </article>
          ))}
      </CardContent>
    </Card>
  );
}
