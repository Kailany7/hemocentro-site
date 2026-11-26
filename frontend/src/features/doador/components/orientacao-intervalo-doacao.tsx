import { CalendarCheck2 } from "lucide-react";

export function OrientacaoIntervaloDoacao() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-brand sm:p-8">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold">
            Intervalo entre doações
          </span>
          <p className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Homens: 60 dias · Mulheres: 90 dias
          </p>
          <p className="mt-2 max-w-md text-sm text-primary-foreground/80">
            Esse é o intervalo mínimo para doação de sangue total. A equipe do hemocentro confirma
            sua aptidão na triagem.
          </p>
        </div>

        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/25 sm:size-24">
          <CalendarCheck2 className="size-9 sm:size-10" />
        </div>
      </div>
    </section>
  );
}
