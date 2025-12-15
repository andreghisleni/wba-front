import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';

interface MessageStatusProps {
  status: string; // 'SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING'
  isUser: boolean; // Só mostramos status nas mensagens QUE EU ENVIEI
  errorDesc?: string; // Descrição do erro, se houver
}

export function MessageStatus({ status, isUser, errorDesc }: MessageStatusProps) {
  // Se a mensagem não fui eu que mandei, não mostra check (não faz sentido ver se eu li minha própria msg recebida aqui)
  if (!isUser) {
    return null;
  }

  // Normaliza para garantir que maiúsculas/minúsculas não quebrem
  const normalizedStatus = status?.toUpperCase() || 'PENDING';

  switch (normalizedStatus) {
    case 'FAILED':
      return (
        <div className='mt-1 flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400'>
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
