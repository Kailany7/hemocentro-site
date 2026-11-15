import { CalendarDays, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Campaign } from "@/features/site/types/public-data";

interface CampanhasAtivasProps {
  campanhas: Campaign[];
  loading: boolean;
  erro: boolean;
}

export function CampanhasAtivas({ campanhas, loading, erro }: CampanhasAtivasProps) {
  return (
    <Card className="border-border shadow-panel">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Campanhas ativas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando campanhas...
          </p>
        )}

        {!loading && erro && (
          <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Não foi possível carregar as campanhas agora. Tente novamente mais tarde.
          </p>
        )}

        {!loading && !erro && campanhas.length === 0 && (
          <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Nenhuma campanha ativa no momento.
          </p>
        )}

        {!loading &&
          !erro &&
          campanhas.map((campanha) => (
            <article
              key={campanha.id}
              className="rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:border-primary/30"
            >
              <h3 className="font-bold">{campanha.titulo}</h3>
              {campanha.descricao && (
                <p className="mt-1 text-sm text-muted-foreground">{campanha.descricao}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
                {campanha.data && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-primary" />
                    {campanha.data}
                  </span>
                )}
                {(campanha.local || campanha.endereco) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    {campanha.local ?? campanha.endereco}
                  </span>
                )}
              </div>
            </article>
          ))}
      </CardContent>
    </Card>
  );
}
