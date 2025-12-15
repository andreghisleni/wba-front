import { Loader2 } from 'lucide-react';
import type { RefObject } from 'react';
import type { GetWhatsappContactsContactIdMessagesQueryResponse } from '@/http/generated/types/GetWhatsappContactsContactIdMessages';
import { MessageBubble } from './message-bubble';

interface ChatMessagesProps {
  messages: GetWhatsappContactsContactIdMessagesQueryResponse;
  isLoadingMessages: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  isLoadingMessages,
  messagesEndRef,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-100/50 p-4 dark:bg-slate-900/50">
      {isLoadingMessages ? (
        <div className="flex h-full items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-3">
          {messages.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-xs">
              Inicie a conversa...
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
