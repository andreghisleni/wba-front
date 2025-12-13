import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

interface MessageStatusProps {
  status: string; // 'SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING'
  isUser: boolean; // Só mostramos status nas mensagens QUE EU ENVIEI
}

export function MessageStatus({ status, isUser }: MessageStatusProps) {
  // Se a mensagem não fui eu que mandei, não mostra check (não faz sentido ver se eu li minha própria msg recebida aqui)
  if (!isUser) return null;

  // Normaliza para garantir que maiúsculas/minúsculas não quebrem
  const normalizedStatus = status?.toUpperCase() || "PENDING";

  switch (normalizedStatus) {
    case "FAILED":
      return (
        <span title="Falha ao enviar">
          <AlertCircle size={14} className="text-red-500" />
        </span>
      );

    case "read": // Caso venha minúsculo
    case "READ":
      return (
        <span title="Lida">
          {/* Dois risquinhos AZUIS */}
          <CheckCheck size={16} className="text-blue-500" />
        </span>
      );

    case "delivered":
    case "DELIVERED":
      return (
        <span title="Entregue">
          {/* Dois risquinhos CINZA */}
          <CheckCheck size={16} className="text-gray-500" />
        </span>
      );

    case "sent":
    case "SENT":
      return (
        <span title="Enviado ao servidor">
          {/* Um risquinho CINZA */}
          <Check size={16} className="text-gray-500" />
        </span>
      );

    default: // PENDING ou status desconhecido
      return (
        <span title="Aguardando envio">
          <Clock size={14} className="text-gray-500" />
        </span>
      );
  }
}