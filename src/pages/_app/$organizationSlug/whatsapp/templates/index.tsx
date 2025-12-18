/** biome-ignore-all lint/suspicious/noConsole: show errors */
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Eye, FileText, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ShowJson } from '@/components/show-json';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
// Hooks gerados (ajuste os imports)
import {
  getWhatsappTemplatesQueryKey,
  useGetWhatsappTemplates,
  useImportWhatsappTemplates,
} from '@/http/generated/hooks';
import { CreateTemplateDialog } from './-components/create-template-dialog';
import { TemplateStatusBadge } from './-components/status-badge';
import { type Template, TemplatePreview } from './-components/template-preview';

export const Route = createFileRoute(
  '/_app/$organizationSlug/whatsapp/templates/'
)({
  component: TemplatesPage,
});

function TemplatesPage() {
  const queryClient = useQueryClient();

  // 1. Hook de Listagem
  const {
    data: templatesResponse,
    isLoading,
    isRefetching,
  } = useGetWhatsappTemplates();

  // O backend retorna { status: 200, data: [...] }
  const templates = templatesResponse || [];

  // 2. Hook de Importação (Sync)
  const { mutateAsync: syncTemplates, isPending: isSyncing } =
    useImportWhatsappTemplates({
      mutation: {
        onSuccess: async (data) => {
          toast.success(data.data.message);
          await queryClient.invalidateQueries({
            queryKey: getWhatsappTemplatesQueryKey(),
          });
        },
        onError: (error) => {
          console.error(error);
          toast.error('Erro ao sincronizar templates.');
        },
      },
    });

  const handleSync = async () => {
    await syncTemplates();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">
            Templates de Mensagem
          </h1>
          <p className="text-muted-foreground">
            Gerencie os modelos para iniciar conversas (Janela de 24h).
          </p>
        </div>

        <div className="flex w-full gap-2 md:w-auto">
          {/* Botão Sincronizar */}
          <Button
            className="flex-1 md:flex-none"
            disabled={isSyncing || isRefetching}
            onClick={handleSync}
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
            />
            Sincronizar Meta
          </Button>

          {/* Botão Criar (Modal) */}
          <CreateTemplateDialog />
        </div>
      </div>

      {/* LISTAGEM */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/10 p-12 text-muted-foreground">
          <FileText className="mb-2 h-10 w-10 opacity-20" />
          <p>Nenhum template encontrado.</p>
          <p className="text-sm">Crie um novo ou sincronize com a Meta.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {templates.map((tpl) => (
            <Card
              className="flex w-full max-w-100 flex-col transition-shadow hover:shadow-md"
              key={tpl.id}
            >
              <CardHeader className="space-y-1 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle
                    className="truncate font-semibold text-sm"
                    title={tpl.name}
                  >
                    {tpl.name}
                  </CardTitle>
                  <TemplateStatusBadge status={tpl.status} />
                </div>
                <div className="flex gap-2 text-muted-foreground text-xs">
                  <span className="rounded bg-muted px-1.5 py-0.5 uppercase">
                    {tpl.language}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 capitalize">
                    {tpl.category.toLowerCase()}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="h-32 overflow-y-auto whitespace-pre-wrap rounded border bg-slate-50 p-3 font-mono text-slate-600 text-xs">
                  {tpl.body}
                </div>
              </CardContent>

              <CardFooter className="justify-between border-t pt-3 text-[10px] text-muted-foreground">
                <span>
                  Atualizado: {new Date(tpl.updatedAt).toLocaleDateString()}
                </span>
                {/* Botão Visualizar */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="h-7 gap-1 px-2"
                      size="sm"
                      variant="ghost"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="text-xs">Ver</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <span>Preview: {tpl.name}</span>
                      </DialogTitle>
                    </DialogHeader>

                    {/* Background simulando WhatsApp */}
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundColor: '#e5ddd5',
                      }}
                    >
                      <TemplatePreview template={tpl as Template} />
                    </div>

                    {/* Info adicional */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground text-xs">
                      <div>
                        <span className="font-medium">Categoria:</span>{' '}
                        {tpl.category.toLowerCase()}
                      </div>
                      <div>
                        <span className="font-medium">Idioma:</span>{' '}
                        {tpl.language}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        {tpl.status}
                      </div>
                      <div>
                        <span className="font-medium">Atualizado:</span>{' '}
                        {new Date(tpl.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {/* <ShowJson data={tpl} /> */}
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
