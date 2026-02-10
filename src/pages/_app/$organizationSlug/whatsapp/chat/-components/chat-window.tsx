import { Phone } from 'lucide-react';
import { useEffect, type RefObject } from 'react';
import type { GetWhatsappContactsQueryResponse } from '@/http/generated/types/GetWhatsappContacts';
import type { GetWhatsappContactsContactIdMessagesQueryResponse } from '@/http/generated/types/GetWhatsappContactsContactIdMessages';
import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';

interface ChatWindowProps {
  selectedContact: GetWhatsappContactsQueryResponse['data'][0] | undefined;
  messages: GetWhatsappContactsContactIdMessagesQueryResponse;
  isLoadingMessages: boolean;
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSendMessage: () => void;
  handleSendImage: (imageUrl: string, caption?: string) => Promise<void>;
  handleSendVideo: (videoUrl: string, caption?: string) => Promise<void>;
  handleSendAudio: (audioUrl: string) => Promise<void>;
  handleSendDocument: (documentUrl: string, filename: string, caption?: string) => Promise<void>;
  isSending: boolean;
  isWindowClosed: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function ChatWindow({
  selectedContact,
  messages,
  isLoadingMessages,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleSendImage,
  handleSendVideo,
  handleSendAudio,
  handleSendDocument,
  isSending,
  isWindowClosed,
  messagesEndRef,
  inputRef,
}: ChatWindowProps) {
  useEffect(() => {
    if (selectedContact?.id && inputRef.current) {
      // Usamos um pequeno setTimeout para garantir que a renderização do React terminou
      // e o elemento já existe no DOM antes de tentar focar.
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50); // 50ms é suficiente

      return () => clearTimeout(timer);
    }
  }, [selectedContact?.id, inputRef]); // <--- A mágica acontece aqui: mudou o ID, executa o foco.

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
        handleSendAudio={handleSendAudio}
        handleSendDocument={handleSendDocument}
        handleSendImage={handleSendImage}
        handleSendMessage={handleSendMessage}
        handleSendVideo={handleSendVideo}
        inputMessage={inputMessage}
        isSending={isSending}
        isWindowClosed={isWindowClosed}
        ref={inputRef}
        selectedContactId={selectedContact.id}
        setInputMessage={setInputMessage}
      />
    </div>
  );
}
