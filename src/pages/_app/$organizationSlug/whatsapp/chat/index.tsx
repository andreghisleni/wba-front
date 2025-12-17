/** biome-ignore-all lint/suspicious/noConsole: legacy code */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: legacy code */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: legacy code */
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSendRedded } from '@/contexts/send-redded';
// Seus hooks gerados
import {
  getWhatsappContactsContactIdMessagesQueryKey,
  useGetWhatsappContacts,
  useGetWhatsappContactsContactIdMessages,
  useMarkWhatsappMessagesAsRead,
  usePostWhatsappMessages,
} from '@/http/generated/hooks';
import { ChatSidebar } from './-components/chat-sidebar';
import { ChatWindow } from './-components/chat-window';

export const Route = createFileRoute('/_app/$organizationSlug/whatsapp/chat/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { sendRedded } = useSendRedded();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [inputMessage, setInputMessage] = useState('');

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook de Marcar como Lida (Manual ou Gerado)
  const { mutate: markAsRead } = useMarkWhatsappMessagesAsRead();

  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    error: errorContacts,
  } = useGetWhatsappContacts({
    query: {
      refetchInterval: 10_000,
    },
  });

  const { data: messages = [], isLoading: isLoadingMessages } =
    useGetWhatsappContactsContactIdMessages(selectedContactId as string, {
      query: {
        enabled: !!selectedContactId,
        refetchInterval: 5000,
      },
    });

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  const isWindowClosed = selectedContact
    ? !selectedContact.isWindowOpen
    : false;

  const { mutateAsync: sendMessage, isPending: isSending } =
    usePostWhatsappMessages({
      mutation: {
        onSuccess: async () => {
          setInputMessage('');
          await queryClient.invalidateQueries({
            queryKey: getWhatsappContactsContactIdMessagesQueryKey(
              selectedContactId as string
            ),
          });
        },
        onError: (error) => {
          console.error(error);
          toast.error('Falha ao enviar mensagem.');
        },
      },
    });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedContactId, isLoadingMessages]);

  useEffect(() => {
    if (
      selectedContactId &&
      selectedContact &&
      selectedContact?.unreadCount > 0 &&
      sendRedded
    ) {
      markAsRead({ contactId: selectedContactId });
    }
  }, [selectedContactId, selectedContact?.unreadCount, markAsRead, sendRedded]);

  const handleSendMessage = async () => {
    if (!(inputMessage.trim() && selectedContactId)) {
      return;
    }
    try {
      await sendMessage({
        data: {
          type: 'text',
          contactId: selectedContactId,
          message: inputMessage,
        },
      });
    } catch {
      // Erro tratado no hook
    }
  };

  if (errorContacts) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar contatos.
      </div>
    );
  }

  return (
    <div className="m-4 flex h-[calc(100vh-120px)] overflow-hidden rounded-lg border bg-background shadow-sm">
      {/* {sendRedded ? 'Não marcar como lido' : 'Marcar como lido'} */}
      <ChatSidebar
        contacts={contacts}
        isLoadingContacts={isLoadingContacts}
        onSelectContact={setSelectedContactId}
        selectedContactId={selectedContactId}
      />

      <ChatWindow
        handleSendMessage={handleSendMessage}
        inputMessage={inputMessage}
        isLoadingMessages={isLoadingMessages}
        isSending={isSending}
        isWindowClosed={isWindowClosed}
        messages={messages}
        messagesEndRef={messagesEndRef}
        selectedContact={selectedContact}
        setInputMessage={setInputMessage}
      />
    </div>
  );
}
