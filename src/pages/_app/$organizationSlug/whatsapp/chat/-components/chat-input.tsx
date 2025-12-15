import { Loader2, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  return (
    <div className="flex-none border-t bg-background p-4">
      {isWindowClosed && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-yellow-100 bg-yellow-50/50 p-4 py-2">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <span className="font-semibold">⚠️ Sessão encerrada.</span>
            <span>Você precisa usar um template para reabrir a conversa.</span>
          </div>
          <SendTemplateDialog contactId={selectedContactId} disabled={true} />
        </div>
      )}

      <form
        className="mx-auto flex max-w-4xl items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <Button
          className="text-muted-foreground"
          disabled={isWindowClosed || isSending}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          className="flex-1"
          disabled={isWindowClosed || isSending}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Digite uma mensagem..."
          value={inputMessage}
        />
        {inputMessage.trim() ? (
          <Button
            className={isWindowClosed ? 'cursor-not-allowed opacity-50' : ''}
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
          <SendTemplateDialog contactId={selectedContactId} disabled={false} />
        )}
      </form>
    </div>
  );
}
