import { useRef, useState, type ChangeEvent } from "react";
import { Eye, FileImage, FileText, ExternalLink, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDoadorAuth } from "@/features/auth/use-doador-auth";
import { enviarCarteiraDoador, excluirCarteiraDoador } from "@/features/auth/doador-auth-service";

const MAXIMO_BYTES = 8 * 1024 * 1024;
const TIPOS_ACEITOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function CarteiraDoador() {
  const { doador, atualizarDoador } = useDoadorAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [visualizando, setVisualizando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const carteira = doador?.carteira;
  const ehImagem = carteira?.resourceType === "image" && carteira.format !== "pdf";

  async function confirmarExclusao() {
    if (excluindo) return;
    setExcluindo(true);
    try {
      const atualizado = await excluirCarteiraDoador();
      atualizarDoador(atualizado);
      setConfirmandoExclusao(false);
      setVisualizando(false);
      toast.success("Carteira excluída do perfil e do Cloudinary.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível excluir sua carteira.");
    } finally {
      setExcluindo(false);
    }
  }

  async function selecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.currentTarget.files?.[0];
    evento.currentTarget.value = "";
    if (!arquivo) return;
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      toast.error("Selecione uma imagem JPEG, PNG ou WebP, ou um arquivo PDF.");
      return;
    }
    if (arquivo.size > MAXIMO_BYTES) {
      toast.error("O arquivo deve ter no máximo 8 MB.");
      return;
    }

    setEnviando(true);
    try {
      const atualizado = await enviarCarteiraDoador(arquivo);
      atualizarDoador(atualizado);
      toast.success("Carteira de doador enviada com sucesso.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar sua carteira.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="border-border shadow-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileImage className="size-5 text-primary" />
          Carteira de doador
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adicione sua carteira em PDF ou imagem. O arquivo pode ter até 8 MB.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {carteira ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {ehImagem ? (
              <img
                src={carteira.url}
                alt="Carteira de doador enviada"
                className="max-h-52 w-full rounded-lg border object-contain sm:w-64"
              />
            ) : (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
                <FileText className="size-8 text-primary" />
                <span className="max-w-64 truncate text-sm font-medium">{carteira.fileName}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setVisualizando(true)}>
                <Eye /> Visualizar
              </Button>
              <Button variant="outline" asChild>
                <a href={carteira.url} target="_blank" rel="noreferrer">
                  Abrir em nova aba <ExternalLink />
                </a>
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmandoExclusao(true)}
                disabled={enviando || excluindo}
              >
                <Trash2 /> Excluir
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma carteira adicionada ainda.</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          onChange={selecionarArquivo}
          disabled={enviando}
        />
        <Button
          variant={carteira ? "outline" : "default"}
          onClick={() => inputRef.current?.click()}
          disabled={enviando || excluindo}
        >
          <Upload />
          {enviando ? "Enviando..." : carteira ? "Substituir carteira" : "Adicionar carteira"}
        </Button>
      </CardContent>

      {carteira && (
        <>
          <Dialog open={visualizando} onOpenChange={setVisualizando}>
            <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-auto sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>Carteira de doador</DialogTitle>
                <DialogDescription>{carteira.fileName}</DialogDescription>
              </DialogHeader>
              {ehImagem ? (
                <img
                  src={carteira.url}
                  alt="Carteira de doador"
                  className="mx-auto max-h-[72vh] max-w-full object-contain"
                />
              ) : (
                <iframe
                  src={carteira.url}
                  title="Visualização da carteira de doador"
                  className="h-[72vh] w-full rounded-md border"
                />
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={confirmandoExclusao} onOpenChange={setConfirmandoExclusao}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir carteira de doador?</AlertDialogTitle>
                <AlertDialogDescription>
                  A carteira será removida do seu perfil e do Cloudinary. Esta ação não pode ser
                  desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                  disabled={excluindo}
                  onClick={(evento) => {
                    evento.preventDefault();
                    void confirmarExclusao();
                  }}
                >
                  {excluindo ? "Excluindo..." : "Excluir carteira"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </Card>
  );
}
