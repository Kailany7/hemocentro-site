import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { atualizarPerfilDoador, type Doador } from "@/features/auth/doador-auth-service";
import { useDoadorAuth } from "@/features/auth/use-doador-auth";
import { apenasDigitos, formatarTelefone, telefoneValido } from "@/lib/formatadores";

type EditarDadosDialogProps = {
  doador: Doador;
  aoFechar: () => void;
};

// Só nome, e-mail, telefone e preferência de notificações são editáveis.
export function EditarDadosDialog({ doador, aoFechar }: EditarDadosDialogProps) {
  const { atualizarDoador } = useDoadorAuth();
  const [nome, setNome] = useState(doador.nome);
  const [email, setEmail] = useState(doador.email);
  const [telefone, setTelefone] = useState(
    doador.telefone ? formatarTelefone(doador.telefone) : "",
  );
  const [notificacoesEmail, setNotificacoesEmail] = useState(
    doador.notificacoesEmail !== false,
  );
  const [salvando, setSalvando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando) return;

    if (!nome.trim()) {
      toast.error("Informe seu nome.");
      return;
    }

    if (telefone && !telefoneValido(telefone)) {
      toast.error("Telefone inválido. Informe 10 ou 11 dígitos.");
      return;
    }

    setSalvando(true);
    try {
      const atualizado = await atualizarPerfilDoador({
        nome: nome.trim(),
        email: email.trim(),
        // Telefone em branco limpa o campo no backend.
        telefone: telefone ? apenasDigitos(telefone) : "",
        notificacoesEmail,
      });
      atualizarDoador(atualizado);
      toast.success("Dados atualizados.");
      aoFechar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar seus dados.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        <form onSubmit={aoEnviar}>
          <DialogHeader>
            <DialogTitle>Editar dados</DialogTitle>
            <DialogDescription>
              Você pode alterar seu nome, e-mail, telefone e preferências de notificação. Os outros
              dados são confirmados pelo hemocentro.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="perfil-nome">Nome completo</Label>
              <Input
                id="perfil-nome"
                required
                autoComplete="name"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil-email">E-mail</Label>
              <Input
                id="perfil-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil-telefone">Telefone (opcional)</Label>
              <Input
                id="perfil-telefone"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                maxLength={15}
                value={telefone}
                onChange={(evento) => setTelefone(formatarTelefone(evento.target.value))}
              />
            </div>

            {/* Toggle de notificações por e-mail */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-3">
                {notificacoesEmail ? (
                  <Bell className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <BellOff className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm font-medium leading-none">Notificações por e-mail</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Receba alertas sobre novas campanhas de doação
                  </p>
                </div>
              </div>
              <Switch
                id="perfil-notificacoes"
                checked={notificacoesEmail}
                onCheckedChange={setNotificacoesEmail}
                aria-label="Ativar ou desativar notificações de campanhas por e-mail"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
