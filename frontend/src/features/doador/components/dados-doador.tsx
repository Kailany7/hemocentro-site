import {
  Bell,
  BellOff,
  ClipboardCheck,
  Droplets,
  IdCard,
  type LucideIcon,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarCpf } from "@/lib/formatadores";

const NAO_INFORMADO = "Não informado";
type DadosDoadorProps = {
  nome: string;
  email: string;
  telefone: string | null;
  // Guardado só com números; a máscara é aplicada na exibição.
  cpf: string | null;
  tipoSanguineo: string;
  status: string | null;
  notificacoesEmail?: boolean;
};

function Campo({
  titulo,
  valor,
  icone: Icone,
  selo,
}: {
  titulo: string;
  valor: string;
  icone: LucideIcon;
  selo?: string | undefined;
}) {
  return (
    <Card className="min-w-0 border-border shadow-panel">
      <CardHeader className="pb-2">
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Icone className="size-4 shrink-0 text-primary" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-2">
        <p className="break-words text-lg font-bold text-foreground [overflow-wrap:anywhere]">
          {valor}
        </p>
        {selo && <Badge variant="secondary">{selo}</Badge>}
      </CardContent>
    </Card>
  );
}

export function DadosDoador({
  nome,
  email,
  telefone,
  cpf,
  tipoSanguineo,
  status,
  notificacoesEmail = true,
}: DadosDoadorProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Dados pessoais</h2>
          <p className="text-sm text-muted-foreground">Você pode editar estas informações.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo titulo="Nome" valor={nome} icone={UserRound} />
          <Campo titulo="E-mail" valor={email} icone={Mail} />
          <Campo titulo="Telefone" valor={telefone ?? NAO_INFORMADO} icone={Phone} />
          <Campo
            titulo="Notificações por e-mail"
            valor={notificacoesEmail ? "Ativadas" : "Desativadas"}
            icone={notificacoesEmail ? Bell : BellOff}
            selo={notificacoesEmail ? undefined : "Silenciado"}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Dados de doador</h2>
          <p className="text-sm text-muted-foreground">
            Estes dados são confirmados pelo hemocentro.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo titulo="CPF" valor={cpf ? formatarCpf(cpf) : NAO_INFORMADO} icone={IdCard} />
          <Campo
            titulo="Tipo sanguíneo"
            valor={tipoSanguineo}
            icone={Droplets}
          />
          <Campo titulo="Status" valor={status ?? "Em triagem"} icone={ClipboardCheck} />
        </div>
      </section>
    </div>
  );
}
