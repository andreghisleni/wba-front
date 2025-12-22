import { Loader2 } from "lucide-react";
import type { RefObject } from "react";
import type { GetWhatsappContactsContactIdMessagesQueryResponse } from "@/http/generated/types/GetWhatsappContactsContactIdMessages";
import { MessageBubble } from "./message-bubble";
import { formatChatDay } from "@/utils/formatChatDay";

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

          {/* Renderiza mensagens com separadores de data */}
          {messages.reduce<React.ReactNode[]>((acc, msg, idx, arr) => {
            const msgDate = new Date(msg.timestamp);
            const prevMsg = arr[idx - 1];
            const prevDate = prevMsg ? new Date(prevMsg.timestamp) : null;
            const isNewDay =
              !prevDate ||
              msgDate.getFullYear() !== prevDate.getFullYear() ||
              msgDate.getMonth() !== prevDate.getMonth() ||
              msgDate.getDate() !== prevDate.getDate();
            if (isNewDay) {
              acc.push(
                <div
                  className="my-4 flex items-center justify-center"
                  key={`day-separator-${msg.id}`}
                >
                  <span className="rounded-full bg-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {formatChatDay(msgDate)}
                  </span>
                </div>
              );
            }
            acc.push(<MessageBubble key={msg.id} message={msg} />);
            return acc;
          }, [])}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
