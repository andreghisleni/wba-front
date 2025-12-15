/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
/** biome-ignore-all lint/performance/noImgElement: <explanation> */
/** biome-ignore-all lint/nursery/noNoninteractiveElementInteractions: <explanation> */
import { Download, FileText } from 'lucide-react'; // Ícones sugeridos
import { formatWhatsAppText } from '@/utils/whatsapp-formatter';
import { MessageStatus } from './message-status';

// Função auxiliar para renderizar o conteúdo baseado no tipo
const RenderMessageContent = ({ message }: { message: any }) => {
  // Se não tiver URL de mídia e não for texto, retorna nulo ou placeholder
  if (!message.mediaUrl && message.type !== 'text') {
    return null;
  }

  const mediaUrl = `https://pub-bf29d6f6bf764b1982512ad9a0b5c9c0.r2.dev/${message.mediaFileName}`;
  // String(message.mediaUrl).replace(
  //   'https://pub-a72a6f120019167e519d34db3c3c75b5.r2.dev/',
  //   'http://localhost:8787/'
  // );

  switch (message.type) {
    case 'image':
    case 'sticker':
      return (
        <div className="mb-1">
          <img
            alt="Imagem"
            className={`cursor-pointer rounded-lg object-cover hover:opacity-90 ${message.type === 'sticker'
              ? 'h-32 w-32 bg-transparent'
              : 'max-h-64 w-auto'
              }`}
            onClick={() => window.open(mediaUrl, '_blank')}
            src={mediaUrl}
          />
        </div>
      );

    case 'video':
      return (
        <div className="mb-1 max-w-[300px]">
          <video className="w-full rounded-lg bg-black" controls>
            <source src={mediaUrl} type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
        </div>
      );

    case 'audio':
    case 'ptt': // "ptt" é o formato de áudio de voz do WhatsApp (Push To Talk)
      return (
        <div className="mb-1 flex min-w-[200px] items-center gap-2">
          {/* <div className="bg-gray-100 p-2 rounded-full text-gray-600">
            <Music size={20} />
          </div> */}
          <audio className="h-8 w-full max-w-[320px]" controls>
            <source src={mediaUrl} type="audio/mp4" />
            <source src={mediaUrl} type="audio/mpeg" />
            <source src={mediaUrl} type="audio/ogg" />
          </audio>
        </div>
      );

    case 'document':
      return (
        <a
          className="mb-1 flex min-w-[240px] items-center gap-3 rounded-lg bg-black/10 p-3 transition-colors hover:bg-black/20"
          href={mediaUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="rounded bg-white p-2 text-red-500">
            <FileText size={24} />
          </div>
          <div className="flex-1 overflow-hidden">
            {/* Tenta mostrar o nome do arquivo, ou usa um genérico */}
            <p className="truncate font-medium text-sm">
              {message.fileName || 'Documento'}
            </p>
            <p className="text-xs uppercase opacity-70">
              {mediaUrl.split('.').pop()} {/* Mostra a extensão (ex: PDF) */}
            </p>
          </div>
          <Download className="opacity-70" size={20} />
        </a>
      );

    default:
      // Caso seja texto puro ou tipo desconhecido, não renderiza mídia extra
      return null;
  }
};

export function MessageBubble({ message }: { message: any }) {
  const isMe = message.direction === 'OUTBOUND';

  return (
    <div
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`relative min-w-48 max-w-[80%] rounded-lg p-3 shadow-sm md:max-w-[60%] ${isMe
          ? 'rounded-tr-none bg-green-600 text-white dark:bg-green-700 dark:text-gray-100'
          : 'rounded-tl-none border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
          }`}
      >
        {/* 1. Renderiza a Mídia (se houver) */}
        <RenderMessageContent message={message} />

        {/* 2. Renderiza o Texto/Legenda (se houver) */}
        {message.body && (
          <p
            className={`whitespace-pre-wrap text-sm ${message.type !== 'text' ? 'mt-2' : ''}`}
          >
            {formatWhatsAppText(message.body)}
          </p>
        )}

        {/* RODAPÉ DA MENSAGEM */}
        <div className="mt-1 flex select-none items-center justify-end gap-1">
          <span className="pt-0.5 text-[10px] text-gray-500 leading-none dark:text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {/* O COMPONENTE DE STATUS ENTRA AQUI */}
          {/* Ele só vai renderizar se isMe for true, pois configuramos isso dentro dele */}
          <MessageStatus
            errorDesc={message.errorDesc}
            isUser={isMe}
            status={message.status}
          />
        </div>
      </div>
    </div>
  );
}
