import { Phone } from 'lucide-react';
import type { RefObject } from 'react';
import type { GetWhatsappContactsQueryResponse } from '@/http/generated/types/GetWhatsappContacts';
import type { GetWhatsappContactsContactIdMessagesQueryResponse } from '@/http/generated/types/GetWhatsappContactsContactIdMessages';
import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';

interface ChatWindowProps {
  selectedContact: GetWhatsappContactsQueryResponse[0] | undefined;
  messages: GetWhatsappContactsContactIdMessagesQueryResponse;
  isLoadingMessages: boolean;
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSendMessage: () => void;
  isSending: boolean;
  isWindowClosed: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatWindow({
  selectedContact,
  messages,
  isLoadingMessages,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isSending,
  isWindowClosed,
  messagesEndRef,
}: ChatWindowProps) {
  if (!selectedContact) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/5 p-8 text-center text-muted-foreground">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Phone className="h-8 w-8 opacity-20" />
        </div>
        <h3 className="font-semibold text-lg">WhatsApp Web Integration</h3>
        <p>Selecione uma conversa ao lado para visualizar o histórico.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/50">
      <ChatHeader selectedContact={selectedContact} />

      <ChatMessages
        isLoadingMessages={isLoadingMessages}
        messages={messages}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        handleSendMessage={handleSendMessage}
        inputMessage={inputMessage}
        isSending={isSending}
        isWindowClosed={isWindowClosed}
        selectedContactId={selectedContact.id}
        setInputMessage={setInputMessage}
      />
    </div>
  );
}
