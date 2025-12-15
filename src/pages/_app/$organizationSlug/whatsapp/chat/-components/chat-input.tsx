/** biome-ignore-all lint/performance/useTopLevelRegex: <explanation> */
import { Loader2, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // <--- Alterado de Input para Textarea
import { cn } from '@/lib/utils'; // Importante para classes condicionais
import { SendTemplateDialog } from './send-template-dialog';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSendMessage: () => void;
  isSending: boolean;
  isWindowClosed: boolean;
  selectedContactId: string;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isSending,
  isWindowClosed,
  selectedContactId,
}: ChatInputProps) {
  // Lógica para capturar o Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Envio com Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    <div className="flex-none border-t bg-background p-4">
      {isWindowClosed && (
        <div className="mb-4 flex flex-col items-center gap-3 rounded-lg border border-yellow-100 bg-yellow-50/50 p-4 py-2">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <span className="font-semibold">⚠️ Sessão encerrada.</span>
            <span>Você precisa usar um template para reabrir a conversa.</span>
          </div>
          <SendTemplateDialog contactId={selectedContactId} disabled={true} />
        </div>
      )}

      <form
        // items-end: Alinha os botões na parte inferior quando o texto cresce
        className="mx-auto flex max-w-4xl items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <Button
          // mb-1: Compensa a altura do Textarea para alinhar visualmente
          className='mb-1 text-muted-foreground'
          disabled={isWindowClosed || isSending}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* O novo Textarea com suporte a multiline */}
        <Textarea
          className='max-h-[140px] min-h-[44px] flex-1 resize-none overflow-y-auto py-3'
          disabled={isWindowClosed || isSending}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown} // <--- Evento adicionado
          placeholder="Digite uma mensagem... (Shift+Enter para pular linha) (*negrito*, _itálico_, - lista)"
          rows={1}
          value={inputMessage}
        />

        {inputMessage.trim() ? (
          <Button
            // mb-1: Alinhamento visual
            className={cn(
              'mb-1',
              isWindowClosed ? 'cursor-not-allowed opacity-50' : ''
            )}
            disabled={!inputMessage.trim() || isSending || isWindowClosed}
            size="icon"
            type="submit"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        ) : (
          // Wrapper div com mb-1 para alinhar o botão do Dialog
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
