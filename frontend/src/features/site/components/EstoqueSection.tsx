import type { StockItem, StockTone } from "../types/public-data";

// Classes de cor para cada nível do estoque
const CORES: Record<StockTone, { ponto: string; barra: string; selo: string }> = {
  estavel: {
    ponto: "bg-success",
    barra: "bg-success",
    selo: "bg-success-soft text-success",
  },
  baixo: {
    ponto: "bg-warning",
    barra: "bg-warning",
    selo: "bg-warning-soft text-warning",
  },
  critico: {
    ponto: "bg-destructive",
    barra: "bg-destructive",
    selo: "bg-destructive/10 text-destructive",
  },
};

interface EstoqueSectionProps {
  items: StockItem[];
  loading: boolean;
}

export function EstoqueSection({ items, loading }: EstoqueSectionProps) {
  return (
    <section id="estoque" className="bg-card py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[.18em] text-primary">
              Transparência
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Como está o estoque?
            </h2>
          </div>
          <div className="max-w-xs rounded-2xl border border-primary/20 bg-primary-soft px-4 py-3 shadow-brand">
            <p className="text-xs font-semibold leading-relaxed text-foreground">
              Estes são os níveis públicos do estoque de sangue. Acompanhe a disponibilidade e
              ajude a manter todos os tipos abastecidos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {items.map((item) => {
            const cores = CORES[item.tom];

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border-2 border-primary/50 bg-background p-4 shadow-panel transition-all hover:-translate-y-1 hover:border-primary/75"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl font-extrabold">{item.tipo}</span>
                  <span className={`mt-1 size-2 rounded-full ${cores.ponto}`} />
                </div>

                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${cores.barra}`}
                    style={{ width: `${item.valor}%` }}
                  />
                </div>

                <div className="mt-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cores.selo}`}>
                    {item.nivel}
                  </span>
                </div>

                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-xs font-bold text-background opacity-0 shadow-panel transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {item.tipo} em {item.valor}%
                </span>
              </div>
            );
          })}
        </div>
        {!loading && items.length === 0 && (
          <p className="rounded-2xl border border-border bg-background p-6 text-center text-sm text-muted-foreground">
            Nenhuma informação de estoque foi cadastrada ainda.
          </p>
        )}
        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando estoque...
          </p>
        )}
      </div>
    </section>
  );
}
