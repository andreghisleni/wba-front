import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Activity, MoreVertical, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Hooks Kubb
import {
  getWebhooksQueryKey,
  useDeleteWebhook,
  useGetWebhooks,
  useTestWebhook,
} from '@/http/generated';
import { WebhookForm } from './-components/webhook-form';
import { WebhookLogsSheet } from './-components/webhook-logs';

export const Route = createFileRoute('/_app/$organizationSlug/webhooks/')({
  component: WebhooksPage,
});

function WebhooksPage() {
  const queryClient = useQueryClient();
  const { data: webhooks, isLoading } = useGetWebhooks();
  const { mutateAsync: testWebhook } = useTestWebhook();

  const [viewingLogsId, setViewingLogsId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mutateAsync: deleteWebhook } = useDeleteWebhook({
    mutation: {
      onError: () => {
        toast.error('Erro ao remover.');
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getWebhooksQueryKey(),
        });
        toast.success('Webhook removido.');
        setDeletingId(null);
      },
    },
  });

  const handleDelete = async () => {
    if (!deletingId) {
      return;
    }
    await deleteWebhook({ id: deletingId });
  };

  const handleTest = async (id: string) => {
    const toastId = toast.loading('Testando conexão...');
    try {
      const res = await testWebhook({ id });
      // res.data ou res dependendo do axios
      const data = res;

      if (data.success) {
        toast.success(`Sucesso! Status ${data.status} (${data.duration}ms)`, {
          id: toastId,
        });
      } else {
        toast.error(`Falha: ${data.responseBody || 'Erro de rede'}`, {
          id: toastId,
        });
      }
    } catch {
      toast.error('Erro ao disparar teste.', { id: toastId });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">Webhooks</h2>
          <p className="text-muted-foreground">
            Receba notificações em tempo real sobre mensagens e eventos.
          </p>
        </div>

        <WebhookForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrações Ativas</CardTitle>
          <CardDescription>
            Configure para onde enviaremos os dados quando algo acontecer no
            WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Segredo</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      Nenhum webhook configurado.
                    </TableCell>
                  </TableRow>
                ) : (
                  webhooks?.map((hook) => (
                    <TableRow key={hook.id}>
                      <TableCell className="font-medium">{hook.name}</TableCell>
                      <TableCell
                        className="max-w-[200px] cursor-pointer truncate font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
                        onDoubleClick={() => {
                          navigator.clipboard.writeText(hook.url);
                          toast.success('URL copiada!');
                          window.getSelection()?.removeAllRanges();
                        }}
                        title="Clique duplo para copiar"
                      >
                        {hook.url}
                      </TableCell>
                      <TableCell
                        className="max-w-[150px] cursor-pointer truncate font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
                        onDoubleClick={() => {
                          if (hook.secret) {
                            navigator.clipboard.writeText(hook.secret);
                            toast.success('Segredo copiado!');
                            window.getSelection()?.removeAllRanges();
                          }
                        }}
                        title="Clique duplo para copiar"
                      >
                        {hook.secret || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {hook.events.map((ev: string) => (
                            <Badge
                              className="h-5 px-1 py-0 text-[10px]"
                              key={ev}
                              variant="outline"
                            >
                              {ev.replace('message.', '')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hook.enabled ? 'default' : 'secondary'}>
                          {hook.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="h-8 w-8 p-0" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleTest(hook.id)}
                            >
                              <Play className="mr-2 h-4 w-4" /> Testar Conexão
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setViewingLogsId(hook.id)}
                            >
                              <Activity className="mr-2 h-4 w-4" /> Ver Logs
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <WebhookForm dropdown webhookToEdit={hook} />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeletingId(hook.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* COMPONENTES MODAIS E GAVETAS */}

      <WebhookLogsSheet
        onClose={() => setViewingLogsId(null)}
        webhookId={viewingLogsId}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setDeletingId(null)}
        open={!!deletingId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente a integração. O sistema parará
              de enviar notificações para esta URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
