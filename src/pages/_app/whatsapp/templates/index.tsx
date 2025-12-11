import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { TemplateStatusBadge } from './-components/status-badge';
import { CreateTemplateDialog } from './-components/create-template-dialog';

// Hooks gerados (ajuste os imports)
import {
  getWhatsappTemplatesQueryKey,
  useGetWhatsappTemplates,
  useImportWhatsappTemplates
} from '@/http/generated/hooks';
import { useQueryClient } from '@tanstack/react-query';

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
    isRefetching
  } = useGetWhatsappTemplates();

  // O backend retorna { status: 200, data: [...] }
  const templates = templatesResponse || [];

  // 2. Hook de Importação (Sync)
  const { mutateAsync: syncTemplates, isPending: isSyncing } = useImportWhatsappTemplates({
    mutation: {
      onSuccess: async (data) => {
        toast.success(data.data.message);
        await queryClient.invalidateQueries({ queryKey: getWhatsappTemplatesQueryKey() });
      },
      onError: (error) => {
        console.error(error);
        toast.error("Erro ao sincronizar templates.");
      }
    }
  });

  const handleSync = async () => {
    await syncTemplates();

  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates de Mensagem</h1>
          <p className="text-muted-foreground">
            Gerencie os modelos para iniciar conversas (Janela de 24h).
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Botão Sincronizar */}
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing || isRefetching}
            className="flex-1 md:flex-none"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar Meta
          </Button>

          {/* Botão Criar (Modal) */}
          <CreateTemplateDialog />
        </div>
      </div>

      {/* LISTAGEM */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-muted-foreground bg-muted/10">
          <FileText className="h-10 w-10 mb-2 opacity-20" />
          <p>Nenhum template encontrado.</p>
          <p className="text-sm">Crie um novo ou sincronize com a Meta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-sm font-semibold truncate" title={tpl.name}>
                    {tpl.name}
                  </CardTitle>
                  <TemplateStatusBadge status={tpl.status} />
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="bg-muted px-1.5 py-0.5 rounded uppercase">{tpl.language}</span>
                  <span className="bg-muted px-1.5 py-0.5 rounded capitalize">{tpl.category.toLowerCase()}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 whitespace-pre-wrap font-mono h-32 overflow-y-auto border">
                  {tpl.body}
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t text-[10px] text-muted-foreground justify-between">
                <span>Atualizado: {new Date(tpl.updatedAt).toLocaleDateString()}</span>
                {/* Se quiser mostrar ID: <span>{tpl.wamid?.slice(-4)}</span> */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}