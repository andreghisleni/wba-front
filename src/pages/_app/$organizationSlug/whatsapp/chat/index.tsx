/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  Filter, // <--- Importe o ícone Filter
  Loader2,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  X, // <--- Importe o X para limpar busca se quiser
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Seus hooks gerados
import {
  getWhatsappContactsContactIdMessagesQueryKey,
  useGetWhatsappContacts,
  useGetWhatsappContactsContactIdMessages,
  useMarkWhatsappMessagesAsRead,
  usePostWhatsappMessages,
} from '@/http/generated/hooks';
import { cn } from '@/lib/utils';

import { MessageBubble } from './-components/message-bubble';
import { NewChatDialog } from './-components/new-chat-dialog';
import { PhoneComponent } from './-components/phone';
import { SendTemplateDialog } from './-components/send-template-dialog';

export const Route = createFileRoute('/_app/$organizationSlug/whatsapp/chat/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [inputMessage, setInputMessage] = useState('');

  // === NOVOS ESTADOS ===
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

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

  // === LÓGICA DE FILTRAGEM COMBINADA ===
  const filteredContacts = contacts.filter((contact) => {
    // 1. Filtro de Texto (Nome ou Telefone)
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (contact.pushName || '')
      .toLowerCase()
      .includes(searchLower);
    const phoneMatch = (contact.waId || '').includes(searchLower);
    const matchesSearch = nameMatch || phoneMatch;

    // 2. Filtro de "Não Lidas"
    const matchesUnread = showUnreadOnly ? contact.unreadCount > 0 : true;

    return matchesSearch && matchesUnread;
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
    if (selectedContactId && selectedContact?.unreadCount > 0) {
      markAsRead({ contactId: selectedContactId });
    }
  }, [selectedContactId, selectedContact?.unreadCount, markAsRead]);

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
      {/* --- SIDEBAR --- */}
      <div className="flex w-80 flex-col border-r bg-muted/10">
        {/* Header da Sidebar com Filtros */}
        <div className="flex flex-none flex-row items-center gap-2 border-b p-4">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              className='h-9 pl-8'
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              value={searchTerm}
            />
            {/* Botãozinho para limpar busca se tiver texto */}
            {searchTerm && (
              <button
                className="absolute top-2.5 right-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm('')}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Botão de Filtro Não Lidas */}
          <Button
            className={cn(
              'h-9 w-9',
              showUnreadOnly && 'bg-primary/10 text-primary hover:bg-primary/20'
            )}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            size="icon"
            title={showUnreadOnly ? 'Mostrar todos' : 'Filtrar não lidas'}
            variant={showUnreadOnly ? 'secondary' : 'ghost'}
          >
            <Filter className="h-4 w-4" />
          </Button>

          <NewChatDialog
            onContactCreated={(contactId) => setSelectedContactId(contactId)}
          />
        </div>

        {/* Lista de Contatos */}
        <div className="w-full overflow-auto">
          <div className="flex flex-col">
            {isLoadingContacts && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoadingContacts && filteredContacts.length === 0 && (
              <div className='flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground text-sm'>
                <Search className="h-8 w-8 opacity-20" />
                <p>Nenhuma conversa encontrada.</p>
                {showUnreadOnly && (
                  <Button
                    className="h-auto p-0 text-xs"
                    onClick={() => setShowUnreadOnly(false)}
                    variant="link"
                  >
                    Ver todas as conversas
                  </Button>
                )}
              </div>
            )}

            {filteredContacts.map((contact) => (
              <button
                className={cn(
                  'flex w-full items-center gap-3 border-border/50 border-b p-4 text-left transition-colors hover:bg-accent',
                  selectedContactId === contact.id && 'bg-accent'
                )}
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                type="button"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={contact.profilePicUrl || undefined} />
                    <AvatarFallback>
                      {(contact.pushName || contact.waId)
                        ?.substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

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

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className='h-4 flex-1 truncate text-muted-foreground text-xs'>
                      {contact.lastMessage}
                    </p>

                    {contact.unreadCount > 0 && (
                      <Badge
                        className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]"
                        variant="destructive"
                      >
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ... (O restante do componente: Área do Chat e Input permanecem iguais) ... */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/50">
        {selectedContact ? (
          <>
            {/* HEADER DO CHAT */}
            <div className="z-10 flex flex-none items-center justify-between border-b bg-background p-3 px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={selectedContact.profilePicUrl || undefined}
                  />
                  <AvatarFallback>
                    {selectedContact.pushName?.substring(0, 2).toUpperCase() ||
                      PhoneComponent(selectedContact.waId)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-sm">
                    {selectedContact.pushName ||
                      PhoneComponent(selectedContact.waId)}
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    <PhoneComponent phone={selectedContact.waId} />
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

            {/* MENSAGENS */}
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

            {/* INPUT DE MENSAGEM */}
            <div className="flex-none border-t bg-background p-4">
              {isWindowClosed && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-yellow-100 bg-yellow-50/50 p-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <span className="font-semibold">⚠️ Sessão encerrada.</span>
                    <span>
                      Você precisa usar um template para reabrir a conversa.
                    </span>
                  </div>
                  <SendTemplateDialog
                    contactId={selectedContactId || ''}
                    disabled={true}
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
                {inputMessage.trim() ? (
                  <Button
                    className={
                      isWindowClosed ? 'cursor-not-allowed opacity-50' : ''
                    }
                    disabled={
                      !inputMessage.trim() || isSending || isWindowClosed
                    }
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
                  <SendTemplateDialog
                    contactId={selectedContactId || ''}
                    disabled={false}
                  />
                )}
              </form>
            </div>
          </>
        ) : (
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
