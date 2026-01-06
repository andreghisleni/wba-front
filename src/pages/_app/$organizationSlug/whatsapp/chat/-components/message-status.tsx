import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageStatusProps {
  status: string; // 'SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING'
  isUser: boolean; // Só mostramos status nas mensagens QUE EU ENVIEI
  errorDesc?: string; // Descrição do erro, se houver

  errorDefinition?: {
    id: string;
    metaCode: number;
    shortExplanation?: string | null;
    detailedExplanation?: string | null;
  };
}

export function MessageStatus({
  status,
  isUser,
  errorDesc,
  errorDefinition,
}: MessageStatusProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Se a mensagem não fui eu que mandei, não mostra check (não faz sentido ver se eu li minha própria msg recebida aqui)
  if (!isUser) {
    return null;
  }

  // Normaliza para garantir que maiúsculas/minúsculas não quebrem
  const normalizedStatus = status?.toUpperCase() || 'PENDING';

  switch (normalizedStatus) {
    case 'FAILED':
      // Se tiver errorDefinition, mostra tooltip + dialog
      if (errorDefinition) {
        return (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='mt-1 flex cursor-pointer items-center gap-1 text-red-600 hover:underline dark:text-red-800'
                    onClick={() => setDialogOpen(true)}
                    type="button"
                  >
                    <AlertCircle size={10} />
                    <span className='text-xs'>Falha no envio</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {errorDefinition.shortExplanation ||
                      'Clique para ver detalhes do erro'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={18} />
                    Erro no envio (Código: {errorDefinition.metaCode})
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-3 pt-2">
                      {errorDefinition.shortExplanation && (
                        <p className="font-medium">
                          {errorDefinition.shortExplanation}
                        </p>
                      )}
                      {errorDefinition.detailedExplanation && (
                        <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                          {errorDefinition.detailedExplanation}
                        </p>
                      )}
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </>
        );
      }

      // Fallback sem errorDefinition
      return (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
          <AlertCircle size={10} />
          {errorDesc || 'Falha no envio'}
        </div>
      );

    case 'read': // Caso venha minúsculo
    case 'READ':
      return (
        <span title="Lida">
          {/* Dois risquinhos AZUIS */}
          <CheckCheck className="text-blue-500 dark:text-blue-400" size={16} />
        </span>
      );

    case 'delivered':
    case 'DELIVERED':
      return (
        <span title="Entregue">
          {/* Dois risquinhos CINZA */}
          <CheckCheck className="text-gray-500 dark:text-gray-400" size={16} />
        </span>
      );

    case 'sent':
    case 'SENT':
      return (
        <span title="Enviado ao servidor">
          {/* Um risquinho CINZA */}
          <Check className="text-gray-500 dark:text-gray-400" size={16} />
        </span>
      );

    default: // PENDING ou status desconhecido
      return (
        <span title="Aguardando envio">
          <Clock className="text-gray-500 dark:text-gray-400" size={14} />
        </span>
      );
  }
}
