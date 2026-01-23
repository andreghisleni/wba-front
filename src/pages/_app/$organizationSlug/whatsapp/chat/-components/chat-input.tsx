/** biome-ignore-all lint/performance/useTopLevelRegex: regex usado dentro de função */
/** biome-ignore-all lint/nursery/noNoninteractiveElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: necessário para drag and drop */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: componente de chat */
import { ImageIcon, Loader2, Paperclip, Send } from 'lucide-react';
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
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface PendingImage {
  file: File;
  previewUrl: string;
  caption: string;
}

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSendMessage: () => void;
  handleSendImage: (imageUrl: string, caption?: string) => Promise<void>;
  isSending: boolean;
  isWindowClosed: boolean;
  selectedContactId: string;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleSendImage,
  isSending,
  isWindowClosed,
  selectedContactId,
}: ChatInputProps) {
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: getPresignedUrl } = useGetPresignedUploadUrl();

  // Validar arquivo de imagem
  const validateImageFile = useCallback((file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Imagem muito grande. Máximo permitido: 5MB.';
    }
    return null;
  }, []);

  // Processar arquivo de imagem
  const processImageFile = useCallback(
    (file: File) => {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      // Criar preview URL
      const previewUrl = URL.createObjectURL(file);
      setPendingImage({ file, previewUrl, caption: '' });
    },
    [validateImageFile]
  );

  // Handler para paste (Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) { return; }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
          }
          return;
        }
      }
    },
    [processImageFile]
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
        if (file.type.startsWith('image/')) {
          processImageFile(file);
        } else {
          toast.error('Apenas imagens são suportadas no momento.');
        }
      }
    },
    [processImageFile]
  );

  // Handler para seleção de arquivo via input
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImageFile(file);
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    },
    [processImageFile]
  );

  // Remover imagem pendente
  const handleRemoveImage = useCallback(() => {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    }
  }, [pendingImage]);

  // Atualizar legenda
  const handleCaptionChange = useCallback(
    (caption: string) => {
      if (pendingImage) {
        setPendingImage({ ...pendingImage, caption });
      }
    },
    [pendingImage]
  );

  // Enviar imagem
  const handleSubmitImage = useCallback(async () => {
    if (!pendingImage) {
      return;
    }

    setIsUploading(true);
    try {
      // 1. Obter URL pré-assinada
      const { uploadUrl, publicUrl } = await getPresignedUrl({
        data: {
          fileName: pendingImage.file.name,
          mimeType: pendingImage.file.type,
          fileSize: pendingImage.file.size,
        },
      });

      // 2. Fazer upload para R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: pendingImage.file,
        headers: {
          'Content-Type': pendingImage.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload da imagem');
      }

      // 3. Enviar mensagem com a imagem
      await handleSendImage(publicUrl, pendingImage.caption || undefined);

      // 4. Limpar estado
      handleRemoveImage();
      toast.success('Imagem enviada com sucesso!');
    } catch (_) {
      toast.error('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }, [pendingImage, getPresignedUrl, handleSendImage, handleRemoveImage]);

  // Lógica para capturar o Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Envio com Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (pendingImage) {
        handleSubmitImage();
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
        accept={ALLOWED_IMAGE_TYPES.join(',')}
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
          <ImageIcon className="h-6 w-6 text-primary" />
          <span className="font-medium text-primary">Solte a imagem aqui</span>
        </div>
      )}

      {/* Preview da imagem pendente */}
      {pendingImage && (
        <div className="mx-auto max-w-4xl">
          <ImagePreview
            caption={pendingImage.caption}
            file={pendingImage.file}
            isUploading={isUploading}
            onCaptionChange={handleCaptionChange}
            onRemove={handleRemoveImage}
            previewUrl={pendingImage.previewUrl}
          />
        </div>
      )}

      <form
        className="mx-auto flex max-w-4xl items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (pendingImage) {
            handleSubmitImage();
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
          title="Anexar imagem"
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
            pendingImage
              ? 'Pressione Enter para enviar a imagem'
              : 'Digite uma mensagem... (Ctrl+V para colar imagem)'
          }
          rows={1}
          value={inputMessage}
        />

        {inputMessage.trim() || pendingImage ? (
          <Button
            className={cn(
              'mb-1',
              isWindowClosed ? 'cursor-not-allowed opacity-50' : ''
            )}
            disabled={
              !(inputMessage.trim() || pendingImage) ||
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
