/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  Loader2,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react'; // Adicionado useRef
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Seus hooks gerados
import {
  getWhatsappContactsContactIdMessagesQueryKey,
  useGetWhatsappContacts,
  useGetWhatsappContactsContactIdMessages,
  usePostWhatsappMessages,
} from '@/http/generated/hooks';
import { cn } from '@/lib/utils';
// O componente de mensagem que criamos anteriormente
import { MessageBubble } from './-components/message-bubble';
import { NewChatDialog } from './-components/new-chat-dialog';
import { SendTemplateDialog } from './-components/send-template-dialog';

export const Route = createFileRoute('/_app/whatsapp/chat/')({
  component: RouteComponent,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
function RouteComponent() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [inputMessage, setInputMessage] = useState('');
  const queryClient = useQueryClient();

  // Ref para o scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2. Hook de Contatos (SEM refetchInterval)
  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    error: errorContacts,
  } = useGetWhatsappContacts({
    query: {
      // Atualiza a lista a cada 10s para ver novos contatos/mensagens
      refetchInterval: 10_000,
    },
  });

  // 3. Hook de Mensagens (SEM refetchInterval)
  const { data: messages = [], isLoading: isLoadingMessages } =
    useGetWhatsappContactsContactIdMessages(selectedContactId as string, {
      query: {
        enabled: !!selectedContactId,
        refetchInterval: 5000,
      },
    });

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // Verifica se a janela está fechada
  // Se isWindowOpen for undefined (carregando), assumimos false por segurança ou true dependendo da UX
  const isWindowClosed = selectedContact
    ? !selectedContact.isWindowOpen
    : false;

  // 3. Mutação de Envio
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

  // Função de scroll para o fundo
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Efeito para rolar quando as mensagens mudam ou troca de contato
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedContactId, isLoadingMessages]);

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
      // O scroll automático via useEffect cuidará da rolagem
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
    // CONTAINER PRINCIPAL: Define altura fixa e esconde o scroll geral da página
    <div className="m-4 flex h-[calc(100vh-120px)] overflow-hidden rounded-lg border bg-background shadow-sm">
      {/* --- SIDEBAR (Esquerda) --- */}
      <div className="flex w-80 flex-col border-r bg-muted/10">
        <div className='flex flex-none flex-row gap-2 border-b p-4'>
          <div className="relative">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar conversas..." />
          </div>
          <NewChatDialog
            onContactCreated={(contactId) => setSelectedContactId(contactId)}
          />
        </div>

        {/* ScrollArea é ok aqui na sidebar */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {isLoadingContacts && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoadingContacts && contacts.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhuma conversa encontrada.
              </div>
            )}

            {contacts.map((contact) => (
              <button
                className={cn(
                  'flex w-full items-center gap-3 border-border/50 border-b p-4 text-left transition-colors hover:bg-accent',
                  selectedContactId === contact.id && 'bg-accent'
                )}
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                type="button"
              >
                <Avatar>
                  <AvatarImage src={contact.profilePicUrl || undefined} />
                  <AvatarFallback>
                    {(contact.pushName || contact.waId)
                      ?.substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-baseline justify-between">
                    <span className="truncate font-medium text-sm">
                      {contact.pushName || contact.waId}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {contact.lastMessageAt &&
                        format(new Date(contact.lastMessageAt), 'HH:mm')}
                    </span>
                  </div>
                  <p className="mt-1 h-4 truncate text-muted-foreground text-xs">
                    {contact.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* --- CHAT AREA (Direita) --- */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/50">
        {selectedContact ? (
          <>
            {/* 1. HEADER (Fixo, flex-none) */}
            <div className="z-10 flex flex-none items-center justify-between border-b bg-background p-3 px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={selectedContact.profilePicUrl || undefined}
                  />
                  <AvatarFallback>
                    {(selectedContact.pushName || selectedContact.waId)
                      ?.substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-sm">
                    {selectedContact.pushName || selectedContact.waId}
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    +{selectedContact.waId}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 2. ÁREA DE MENSAGENS (flex-1, overflow-y-auto) */}
            {/* Nota: Usando div nativa em vez de ScrollArea para controle mais fácil do scroll-to-bottom */}
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

                  {/* Elemento invisível para ancorar o scroll no fim */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* 3. INPUT AREA (Fixo, flex-none) */}
            <div className="flex-none border-t bg-background p-4">
              {/* AVISO VISUAL DE JANELA FECHADA */}
              {isWindowClosed && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-yellow-100 bg-yellow-50/50 p-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <span className="font-semibold">⚠️ Sessão encerrada.</span>
                    <span>
                      Você precisa usar um template para reabrir a conversa.
                    </span>
                  </div>

                  {/* Aqui está o componente novo */}
                  <SendTemplateDialog
                    contactId={selectedContactId || ''}
                    disabled={true} // Passamos true para ele renderizar como botão grande
                  />
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
                <Button
                  className={
                    isWindowClosed ? 'cursor-not-allowed opacity-50' : ''
                  }
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
              </form>
            </div>
          </>
        ) : (
          /* Estado Vazio */
          <div className="flex flex-1 flex-col items-center justify-center bg-muted/5 p-8 text-center text-muted-foreground">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Phone className="h-8 w-8 opacity-20" />
            </div>
            <h3 className="font-semibold text-lg">WhatsApp Web Integration</h3>
            <p>Selecione uma conversa ao lado para visualizar o histórico.</p>
          </div>
        )}
      </div>
    </div>
  );
}
