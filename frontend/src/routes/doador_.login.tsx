import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Droplets, IdCard, LockKeyhole, Mail, Megaphone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginDoador, salvarToken } from "@/features/auth/doador-auth-service";
import fundoMedico from "@/images/Fundo Médico Minimalista com Ondas Vermelhas.png";

export const Route = createFileRoute("/doador_/login")({
  head: () => ({
    meta: [
      { title: "Entrar - HemoHelp" },
      { name: "description", content: "Acesse sua área do doador no HemoHelp." },
    ],
  }),
  component: LoginDoador,
});

function LoginDoador() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      const { token } = await loginDoador({ email: email.trim(), senha });
      salvarToken(token);
      toast.success("Bem-vindo de volta!");
      await navigate({ to: "/doador", replace: true });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main
      className="landing flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-5 py-12"
      style={{ backgroundImage: `url(${fundoMedico})` }}
    >
      <Link
        to="/"
        className="mb-10 flex items-center gap-2.5 font-bold tracking-tight text-foreground"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-brand">
          <Droplets />
        </span>
        <span className="text-xl">
          Hemo<span className="text-primary">Help</span>
        </span>
      </Link>

      <div className="grid w-full max-w-7xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)_minmax(0,1fr)]">
        <aside className="relative order-2 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-red-700 to-red-900 p-7 text-primary-foreground shadow-xl shadow-primary/25 sm:p-9 lg:order-1 lg:col-start-1 lg:min-h-[460px]">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 size-44 rounded-full border-[28px] border-primary-foreground/10"
          />
          <div className="relative">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
              <Droplets className="size-6" />
            </span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-primary-foreground/75">
              Área do doador
            </p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">
              Benefícios da sua conta
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/85">
              Mais informação, organização e praticidade para sua jornada como doador.
            </p>

            <div className="mt-7 space-y-3">
              <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4">
                <div className="flex items-center gap-3">
                  <Megaphone className="size-5 shrink-0" />
                  <h3 className="font-bold">Novas campanhas</h3>
                </div>
                <p className="mt-2 text-sm leading-5 text-primary-foreground/85">
                  Receba avisos por e-mail sobre novas campanhas de doação.
                </p>
              </div>
              <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="size-5 shrink-0" />
                  <h3 className="font-bold">Cronograma de doações</h3>
                </div>
                <p className="mt-2 text-sm leading-5 text-primary-foreground/85">
                  Organize suas doações e acompanhe quando poderá doar novamente.
                </p>
              </div>
              <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4">
                <div className="flex items-center gap-3">
                  <IdCard className="size-5 shrink-0" />
                  <h3 className="font-bold">Carteira sempre à mão</h3>
                </div>
                <p className="mt-2 text-sm leading-5 text-primary-foreground/85">
                  Guarde sua carteira de doador em PDF ou imagem no perfil e acesse quando precisar.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <Card className="order-1 w-full rounded-2xl border-border shadow-panel lg:order-2 lg:col-start-2">
          <CardHeader className="space-y-2 p-7 pb-4 sm:p-8 sm:pb-4">
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Acesse sua conta
            </CardTitle>
            <CardDescription>Entre com seu e-mail e senha para acessar seu perfil.</CardDescription>
          </CardHeader>
          <CardContent className="p-7 pt-2 sm:p-8 sm:pt-2">
            <form onSubmit={aoEnviar} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="voce@email.com"
                    className="h-11 bg-background pl-9"
                    value={email}
                    onChange={(evento) => setEmail(evento.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="senha"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 bg-background pl-9"
                    value={senha}
                    onChange={(evento) => setSenha(evento.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={enviando}
                className="h-11 w-full rounded-full shadow-brand"
              >
                {enviando ? "Entrando..." : "Entrar"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link to="/doador/cadastro" className="font-semibold text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <Button asChild variant="ghost" className="mt-5 rounded-full">
        <Link to="/">Voltar ao site</Link>
      </Button>
    </main>
  );
}
