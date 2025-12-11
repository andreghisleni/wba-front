import { FileText, Download, Play, Music } from "lucide-react"; // Ícones sugeridos

// Função auxiliar para renderizar o conteúdo baseado no tipo
const RenderMessageContent = ({ message }: { message: any }) => {
  // Se não tiver URL de mídia e não for texto, retorna nulo ou placeholder
  if (!message.mediaUrl && message.type !== "text") return null;

  const mediaUrl = String(message.mediaUrl).replace('https://pub-a72a6f120019167e519d34db3c3c75b5.r2.dev/', 'http://localhost:8787/');

  switch (message.type) {
    case "image":
    case "sticker":
      return (
        <div className="mb-1">
          <img
            src={mediaUrl}
            alt="Imagem"
            className={`rounded-lg object-cover cursor-pointer hover:opacity-90 ${message.type === "sticker" ? "w-32 h-32 bg-transparent" : "max-h-64 w-auto"
              }`}
            onClick={() => window.open(mediaUrl, "_blank")}
          />
        </div>
      );

    case "video":
      return (
        <div className="mb-1 max-w-[300px]">
          <video controls className="w-full rounded-lg bg-black">
            <source src={mediaUrl} type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
        </div>
      );

    case "audio":
    case "ptt": // "ptt" é o formato de áudio de voz do WhatsApp (Push To Talk)
      return (
        <div className="flex items-center gap-2 min-w-[200px] mb-1">
          {/* <div className="bg-gray-100 p-2 rounded-full text-gray-600">
            <Music size={20} />
          </div> */}
          <audio controls className="h-8 w-full max-w-[320px]">
            <source src={mediaUrl} type="audio/mp4" />
            <source src={mediaUrl} type="audio/mpeg" />
            <source src={mediaUrl} type="audio/ogg" />
          </audio>
        </div>
      );

    case "document":
      return (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-black/10 p-3 rounded-lg hover:bg-black/20 transition-colors mb-1 min-w-[240px]"
        >
          <div className="bg-white p-2 rounded text-red-500">
            <FileText size={24} />
          </div>
          <div className="flex-1 overflow-hidden">
            {/* Tenta mostrar o nome do arquivo, ou usa um genérico */}
            <p className="text-sm font-medium truncate">
              {message.fileName || "Documento"}
            </p>
            <p className="text-xs opacity-70 uppercase">
              {mediaUrl.split('.').pop()} {/* Mostra a extensão (ex: PDF) */}
            </p>
          </div>
          <Download size={20} className="opacity-70" />
        </a>
      );

    default:
      // Caso seja texto puro ou tipo desconhecido, não renderiza mídia extra
      return null;
  }
};

export function MessageBubble({ message }: { message: any }) {
  const isMe = message.direction === "OUTBOUND";

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`relative max-w-[80%] md:max-w-[60%] p-3 rounded-lg shadow-sm ${isMe
          ? "bg-green-600 text-white rounded-tr-none"
          : "bg-white text-gray-900 border border-gray-200 rounded-tl-none"
          }`}
      >
        {/* 1. Renderiza a Mídia (se houver) */}
        <RenderMessageContent message={message} />

        {/* 2. Renderiza o Texto/Legenda (se houver) */}
        {message.body && (
          <p className={`text-sm whitespace-pre-wrap ${message.type !== 'text' ? 'mt-2' : ''}`}>
            {message.body}
          </p>
        )}

        {/* 3. Rodapé com Hora e Status */}
        <div className={`flex justify-end items-center gap-1 mt-1 ${isMe ? "text-green-100" : "text-gray-400"}`}>
          <span className="text-[10px] leading-none">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {/* Aqui você pode colocar os ícones de check (v, vv, azul) baseados no message.status */}
        </div>
      </div>
    </div>
  );
}