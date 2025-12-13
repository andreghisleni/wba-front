import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
// Hooks gerados (ajuste os imports)
import {
  getWhatsappTemplatesQueryKey,
  useGetWhatsappTemplates,
  useImportWhatsappTemplates,
} from '@/http/generated/hooks';
import { CreateTemplateDialog } from './-components/create-template-dialog';
import { TemplateStatusBadge } from './-components/status-badge';

export const Route = createFileRoute('/_app/whatsapp/templates/')({
  component: TemplatesPage,
});

function TemplatesPage() {
  const queryClient = useQueryClient();

  // 1. Hook de Listagem
  const {
    data: templatesResponse,
    isLoading,
    refetch,
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
    <div className='mx-auto max-w-7xl space-y-6 p-6'>
      {/* HEADER */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='font-bold text-2xl tracking-tight'>
            Templates de Mensagem
          </h1>
          <p className="text-muted-foreground">
            Gerencie os modelos para iniciar conversas (Janela de 24h).
          </p>
        </div>

        <div className='flex w-full gap-2 md:w-auto'>
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
        <div className='flex h-64 items-center justify-center'>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/10 p-12 text-muted-foreground'>
          <FileText className='mb-2 h-10 w-10 opacity-20' />
          <p>Nenhum template encontrado.</p>
          <p className="text-sm">Crie um novo ou sincronize com a Meta.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {templates.map((tpl) => (
            <Card
              className='flex w-full max-w-100 flex-col transition-shadow hover:shadow-md'
              key={tpl.id}
            >
              <CardHeader className='space-y-1 pb-3'>
                <div className='flex items-start justify-between gap-2'>
                  <CardTitle
                    className='truncate font-semibold text-sm'
                    title={tpl.name}
                  >
                    {tpl.name}
                  </CardTitle>
                  <TemplateStatusBadge status={tpl.status} />
                </div>
                <div className='flex gap-2 text-muted-foreground text-xs'>
                  <span className='rounded bg-muted px-1.5 py-0.5 uppercase'>
                    {tpl.language}
                  </span>
                  <span className='rounded bg-muted px-1.5 py-0.5 capitalize'>
                    {tpl.category.toLowerCase()}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className='h-32 overflow-y-auto whitespace-pre-wrap rounded border bg-slate-50 p-3 font-mono text-slate-600 text-xs'>
                  {tpl.body}
                </div>
              </CardContent>

              <CardFooter className='justify-between border-t pt-3 text-[10px] text-muted-foreground'>
                <span>
                  Atualizado: {new Date(tpl.updatedAt).toLocaleDateString()}
                </span>
                {/* Se quiser mostrar ID: <span>{tpl.wamid?.slice(-4)}</span> */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
