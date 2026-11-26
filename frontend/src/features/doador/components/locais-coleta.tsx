import { Clock3, Copy, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Campaign, CollectionLocation } from "@/features/site/types/public-data";
import { obterLocaisDasCampanhas } from "@/features/site/utils/locais-das-campanhas";
import { linkDoGoogleMaps } from "@/features/site/utils/google-maps";
import { enderecoParaCopiar } from "@/features/site/utils/endereco-local";

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
            <a
              key={`campanha-${campanha.id}`}
              href={linkDoGoogleMaps({ ...localDoMapa, endereco })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${campanha.titulo}: abrir no Google Maps (nova aba)`}
              className="block rounded-xl border border-primary/30 bg-secondary/40 p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
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

              <div className="mt-3 flex gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="min-w-0 flex-1 justify-between bg-background text-primary"
                >
                  <a
                    href={linkDoGoogleMaps({ ...localDoMapa, endereco })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Maps <Navigation />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-0 flex-1 px-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        enderecoParaCopiar({ ...localDoMapa, endereco }),
                      );
                      toast.success("Endere?o copiado.");
                    } catch {
                      toast.error("N?o foi poss?vel copiar o endere?o neste navegador.");
                    }
                  }}
                >
                  <Copy /> Copiar
                </Button>
              </div>
            </a>
          ))}

        {!loading &&
          !erro &&
          locais.map((local) => (
            <a
              key={local.id}
              href={linkDoGoogleMaps(local)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${local.nome}: abrir no Google Maps (nova aba)`}
              className="block rounded-xl border border-border bg-secondary/40 p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
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
                  {(local.endereco || local.cep) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {local.endereco || `CEP ${local.cep}`}
                    </p>
                  )}
                  {local.horario && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                      <Clock3 className="size-3.5" />
                      {local.horario}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="min-w-0 flex-1 justify-between bg-background text-primary"
                >
                  <a
                    href={linkDoGoogleMaps({ ...localDoMapa, endereco })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Maps <Navigation />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-0 flex-1 px-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        enderecoParaCopiar({ ...localDoMapa, endereco }),
                      );
                      toast.success("Endere?o copiado.");
                    } catch {
                      toast.error("N?o foi poss?vel copiar o endere?o neste navegador.");
                    }
                  }}
                >
                  <Copy /> Copiar
                </Button>
              </div>
            </a>
          ))}
      </CardContent>
    </Card>
  );
}
