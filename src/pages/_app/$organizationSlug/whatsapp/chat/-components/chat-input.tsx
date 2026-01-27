/** biome-ignore-all lint/performance/useTopLevelRegex: regex usado dentro de função */
/** biome-ignore-all lint/nursery/noNoninteractiveElementInteractions: necessário para drag and drop */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: necessário para drag and drop */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: componente de chat */
import { FileIcon, FileText, Loader2, Mic, Paperclip, Send, Video } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGetPresignedUploadUrl } from '@/http/generated';
import { cn } from '@/lib/utils';
import { ImagePreview } from './image-preview';
import { SendTemplateDialog } from './send-template-dialog';

// Tipos de imagem permitidos
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Tipos de vídeo permitidos
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/3gpp',
];

// Tipos de áudio permitidos
const ALLOWED_AUDIO_TYPES = [
  'audio/aac',
  'audio/mp4',
  'audio/mpeg',
  'audio/amr',
  'audio/ogg',
  'audio/opus',
];

// Tipos de documento permitidos
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

// Todos os tipos de mídia permitidos
const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 16 * 1024 * 1024; // 16MB
const MAX_AUDIO_SIZE = 16 * 1024 * 1024; // 16MB
const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100MB

type MediaType = 'image' | 'video' | 'audio' | 'document';

interface PendingMedia {
  file: File;
  previewUrl: string;
  caption: string;
  type: MediaType;
}

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSendMessage: () => void;
  handleSendImage: (imageUrl: string, caption?: string) => Promise<void>;
  handleSendVideo: (videoUrl: string, caption?: string) => Promise<void>;
  handleSendAudio: (audioUrl: string) => Promise<void>;
  handleSendDocument: (documentUrl: string, filename: string, caption?: string) => Promise<void>;
  isSending: boolean;
  isWindowClosed: boolean;
  selectedContactId: string;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleSendImage,
  handleSendVideo,
  handleSendAudio,
  handleSendDocument,
  isSending,
  isWindowClosed,
  selectedContactId,
}: ChatInputProps) {
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: getPresignedUrl } = useGetPresignedUploadUrl();

  // Detectar tipo de mídia
  const getMediaType = useCallback((mimeType: string): MediaType | null => {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return 'image';
    }
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return 'video';
    }
    if (ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return 'audio';
    }
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
      return 'document';
    }
    return null;
  }, []);

  // Validar arquivo de mídia
  const validateMediaFile = useCallback((file: File): string | null => {
    const mediaType = getMediaType(file.type);
    
    if (!mediaType) {
      return 'Tipo de arquivo não suportado. Use imagens (JPEG, PNG, WebP, GIF), vídeos (MP4, 3GPP), áudios (AAC, MP4, MP3, OGG) ou documentos (PDF, DOC, XLS, PPT, TXT).';
    }
    
    if (mediaType === 'image' && file.size > MAX_IMAGE_SIZE) {
      return 'Imagem muito grande. Máximo permitido: 5MB.';
    }
    if (mediaType === 'video' && file.size > MAX_VIDEO_SIZE) {
      return 'Vídeo muito grande. Máximo permitido: 16MB.';
    }
    if (mediaType === 'audio' && file.size > MAX_AUDIO_SIZE) {
      return 'Áudio muito grande. Máximo permitido: 16MB.';
    }
    if (mediaType === 'document' && file.size > MAX_DOCUMENT_SIZE) {
      return 'Documento muito grande. Máximo permitido: 100MB.';
    }
    
    return null;
  }, [getMediaType]);

  // Processar arquivo de mídia
  const processMediaFile = useCallback(
    (file: File) => {
      const error = validateMediaFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      const mediaType = getMediaType(file.type);
      if (!mediaType) {
        return;
      }

      // Criar preview URL
      const previewUrl = URL.createObjectURL(file);
      setPendingMedia({ file, previewUrl, caption: '', type: mediaType });
    },
    [validateMediaFile, getMediaType]
  );

  // Handler para paste (Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) { return; }

      for (const item of items) {
        if (item.type.startsWith('image/') || item.type.startsWith('video/') || item.type.startsWith('audio/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processMediaFile(file);
          }
          return;
        }
      }
    },
    [processMediaFile]
  );

  // Handler para drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  // Handler para drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  // Handler para drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const mediaType = getMediaType(file.type);
        if (mediaType) {
          processMediaFile(file);
        } else {
          toast.error('Tipo de arquivo não suportado.');
        }
      }
    },
    [processMediaFile, getMediaType]
  );

  // Handler para seleção de arquivo via input
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processMediaFile(file);
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    },
    [processMediaFile]
  );

  // Remover mídia pendente
  const handleRemoveMedia = useCallback(() => {
    if (pendingMedia) {
      URL.revokeObjectURL(pendingMedia.previewUrl);
      setPendingMedia(null);
    }
  }, [pendingMedia]);

  // Atualizar legenda
  const handleCaptionChange = useCallback(
    (caption: string) => {
      if (pendingMedia) {
        setPendingMedia({ ...pendingMedia, caption });
      }
    },
    [pendingMedia]
  );

  // Enviar mídia
  const handleSubmitMedia = useCallback(async () => {
    if (!pendingMedia) {
      return;
    }

    setIsUploading(true);
    try {
      // 1. Obter URL pré-assinada
      const { uploadUrl, publicUrl } = await getPresignedUrl({
        data: {
          fileName: pendingMedia.file.name,
          mimeType: pendingMedia.file.type,
          fileSize: pendingMedia.file.size,
        },
      });

      // 2. Fazer upload para R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: pendingMedia.file,
        headers: {
          'Content-Type': pendingMedia.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload do arquivo');
      }

      // 3. Enviar mensagem baseado no tipo de mídia
      switch (pendingMedia.type) {
        case 'image':
          await handleSendImage(publicUrl, pendingMedia.caption || undefined);
          break;
        case 'video':
          await handleSendVideo(publicUrl, pendingMedia.caption || undefined);
          break;
        case 'audio':
          await handleSendAudio(publicUrl);
          break;
        case 'document':
          await handleSendDocument(publicUrl, pendingMedia.file.name, pendingMedia.caption || undefined);
          break;
        default:
          break;
      }

      // 4. Limpar estado
      handleRemoveMedia();
      
      const typeLabels = { image: 'Imagem', video: 'Vídeo', audio: 'Áudio', document: 'Documento' };
      toast.success(`${typeLabels[pendingMedia.type]} enviado com sucesso!`);
    } catch (_) {
      toast.error('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }, [pendingMedia, getPresignedUrl, handleSendImage, handleSendVideo, handleSendAudio, handleSendDocument, handleRemoveMedia]);

  // Lógica para capturar o Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Envio com Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (pendingMedia) {
        handleSubmitMedia();
      } else {
        handleSendMessage();
      }
      return;
    }

    // 2. Continuação de Lista Automática
    if (e.key === 'Enter' && e.shiftKey) {
      // Pega a linha atual onde o cursor está
      const cursorPosition = e.currentTarget.selectionStart;
      const textBeforeCursor = inputMessage.slice(0, cursorPosition);
      const currentLine = textBeforeCursor.split('\n').pop() || '';

      // Verifica se a linha começa com "- " ou "* "
      const listMatch = currentLine.match(/^(\s*[-*])\s/);

      if (listMatch) {
        // Se a linha atual é uma lista, o comportamento padrão do Enter vai quebrar linha.
        // Nós vamos inserir manualmente a quebra + o marcador da lista.
        e.preventDefault();

        const listMarker = listMatch[1]; // "- " ou "* "
        const insertion = `\n${listMarker} `;

        // Insere no texto na posição certa
        const newText =
          inputMessage.slice(0, cursorPosition) +
          insertion +
          inputMessage.slice(e.currentTarget.selectionEnd);

        setInputMessage(newText);

        // Hackzinho para reposicionar o cursor logo após o marcador inserido
        // (Precisa de um timeout mínimo para o React renderizar o novo value)
        setTimeout(() => {
          const newCursorPos = cursorPosition + insertion.length;
          e.currentTarget.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: div com drag and drop
    <div
      className={cn(
        'flex-none border-t bg-background p-4 transition-colors',
        isDragOver && 'bg-primary/5 ring-2 ring-primary ring-inset'
      )}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="region"
    >
      {/* Input de arquivo oculto */}
      <input
        accept={ALLOWED_MEDIA_TYPES.join(',')}
        className="hidden"
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />

      {isWindowClosed && (
        <div className="mb-4 flex flex-col items-center gap-3 rounded-lg border border-yellow-100 bg-yellow-50/50 p-4 py-2">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <span className="font-semibold">⚠️ Sessão encerrada.</span>
            <span>Você precisa usar um template para reabrir a conversa.</span>
          </div>
          <SendTemplateDialog contactId={selectedContactId} disabled={true} />
        </div>
      )}

      {/* Indicador de drag over */}
      {isDragOver && (
        <div className='mb-4 flex items-center justify-center gap-2 rounded-lg border-2 border-primary border-dashed bg-primary/5 p-6'>
          <FileIcon className="h-6 w-6 text-primary" />
          <span className="font-medium text-primary">Solte o arquivo aqui (imagem, vídeo, áudio ou documento)</span>
        </div>
      )}

      {/* Preview da mídia pendente */}
      {pendingMedia && (
        <div className="mx-auto mb-4 max-w-4xl">
          {pendingMedia.type === 'image' && (
            <ImagePreview
              caption={pendingMedia.caption}
              file={pendingMedia.file}
              isUploading={isUploading}
              onCaptionChange={handleCaptionChange}
              onRemove={handleRemoveMedia}
              previewUrl={pendingMedia.previewUrl}
            />
          )}
          {pendingMedia.type === 'video' && (
            <div className="relative rounded-lg border bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Video className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{pendingMedia.file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(pendingMedia.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={handleRemoveMedia}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Remover
                </Button>
              </div>
              {/* biome-ignore lint/a11y/useMediaCaption: preview de vídeo não precisa de legenda */}
              <video
                className="max-h-48 w-full rounded bg-black"
                controls
                src={pendingMedia.previewUrl}
              />
              <Textarea
                className="mt-3"
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder="Adicionar legenda (opcional)"
                rows={1}
                value={pendingMedia.caption}
              />
            </div>
          )}
          {pendingMedia.type === 'audio' && (
            <div className="relative rounded-lg border bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Mic className="h-8 w-8 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{pendingMedia.file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(pendingMedia.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={handleRemoveMedia}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Remover
                </Button>
              </div>
              {/* biome-ignore lint/a11y/useMediaCaption: preview de áudio não precisa de legenda */}
              <audio
                className="w-full"
                controls
                src={pendingMedia.previewUrl}
              />
            </div>
          )}
          {pendingMedia.type === 'document' && (
            <div className="relative rounded-lg border bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{pendingMedia.file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(pendingMedia.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={handleRemoveMedia}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Remover
                </Button>
              </div>
              <Textarea
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder="Adicionar legenda (opcional)"
                rows={1}
                value={pendingMedia.caption}
              />
            </div>
          )}
        </div>
      )}

      <form
        className="mx-auto flex max-w-4xl items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (pendingMedia) {
            handleSubmitMedia();
          } else {
            handleSendMessage();
          }
        }}
      >
        <Button
          className="mb-1 text-muted-foreground"
          disabled={isWindowClosed || isSending || isUploading}
          onClick={() => fileInputRef.current?.click()}
          size="icon"
          title="Anexar arquivo (imagem, vídeo, áudio ou documento)"
          type="button"
          variant="ghost"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* O novo Textarea com suporte a multiline e paste */}
        <Textarea
          className="max-h-[140px] min-h-[44px] flex-1 resize-none overflow-y-auto py-3"
          disabled={isWindowClosed || isSending || isUploading}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            pendingMedia
              ? 'Pressione Enter para enviar'
              : 'Digite uma mensagem... (Ctrl+V para colar mídia)'
          }
          rows={1}
          value={inputMessage}
        />

        {inputMessage.trim() || pendingMedia ? (
          <Button
            className={cn(
              'mb-1',
              isWindowClosed ? 'cursor-not-allowed opacity-50' : ''
            )}
            disabled={
              !(inputMessage.trim() || pendingMedia) ||
              isSending ||
              isUploading ||
              isWindowClosed
            }
            size="icon"
            type="submit"
          >
            {isSending || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="mb-1">
            <SendTemplateDialog
              contactId={selectedContactId}
              disabled={false}
            />
          </div>
        )}
      </form>
    </div>
  );
}
