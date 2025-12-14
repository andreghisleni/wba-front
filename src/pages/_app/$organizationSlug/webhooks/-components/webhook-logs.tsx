import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, Eye, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetWebhookLogDetails,
  useGetWebhookLogs,
} from '@/http/generated';

interface WebhookLogsSheetProps {
  webhookId: string | null;
  onClose: () => void;
}

export function WebhookLogsSheet({
  webhookId,
  onClose,
}: WebhookLogsSheetProps) {
  const {
    data: logs,
    isLoading,
    refetch,
  } = useGetWebhookLogs(
    webhookId || '',
    { query: { enabled: !!webhookId } }
  );

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <>
      <Sheet onOpenChange={(open) => !open && onClose()} open={!!webhookId}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader className="mb-4">
            <SheetTitle>Histórico de Disparos</SheetTitle>
            <SheetDescription>
              Últimas 50 tentativas de envio para este webhook.
            </SheetDescription>
            <Button
              className="mt-2 w-fit"
              onClick={() => refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-3 w-3" /> Atualizar
            </Button>
          </SheetHeader>

          {isLoading ? (
            <div className='mt-4 space-y-3'>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton className="h-20 w-full" key={i} />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[80vh] pr-4">
              <div className="space-y-4">
                {logs?.length === 0 && (
                  <div className='py-10 text-center text-muted-foreground'>
                    Nenhum registro encontrado.
                  </div>
                )}
                {logs?.map((log) => (
                  <div
                    className='flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50'
                    key={log.id}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-semibold text-sm">
                          {log.event}
                        </span>
                      </div>
                      <Badge variant={log.success ? 'outline' : 'destructive'}>
                        {log.responseStatus || 'ERR'}
                      </Badge>
                    </div>

                    <div className='flex items-center justify-between text-muted-foreground text-xs'>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.createdAt), 'dd/MM HH:mm:ss', {
                          locale: ptBR,
                        })}
                      </span>
                      <span>{log.duration}ms</span>
                    </div>

                    <Button
                      className='mt-1 h-7 w-full text-xs'
                      onClick={() => setSelectedLogId(log.id)}
                      size="sm"
                      variant="secondary"
                    >
                      <Eye className="mr-2 h-3 w-3" /> Ver Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* MODAL DE DETALHES (Payload) */}
      <LogDetailsDialog
        logId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />
    </>
  );
}

// Componente Interno para Detalhes
function LogDetailsDialog({
  logId,
  onClose,
}: {
  logId: string | null;
  onClose: () => void;
}) {
  const { data: logDetails, isLoading } = useGetWebhookLogDetails(
    logId || '',
    { query: { enabled: !!logId } }
  );

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={!!logId}>
      <DialogContent className='max-h-[85vh] max-w-3xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Detalhes da Requisição</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : logDetails ? (
          <div className="space-y-4">
            <div>
              <h4 className='mb-1 font-medium text-sm'>
                Payload Enviado (JSON)
              </h4>
              <div className='max-h-[300px] overflow-auto rounded-md bg-slate-950 p-4 font-mono text-slate-50 text-xs'>
                <pre>{JSON.stringify(logDetails.payload, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h4 className='mb-1 font-medium text-sm'>Resposta do Servidor</h4>
              <div className='break-all rounded-md bg-muted p-4 font-mono text-xs'>
                {logDetails.responseBody || '(Sem corpo de resposta)'}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
