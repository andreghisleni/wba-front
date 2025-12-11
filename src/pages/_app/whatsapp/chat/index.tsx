import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'; // Adicionado useRef
import { format } from 'date-fns';
import { MoreVertical, Paperclip, Phone, Search, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Seus hooks gerados
import {
  getWhatsappContactsContactIdMessagesQueryKey,
  useGetWhatsappContacts,
  useGetWhatsappContactsContactIdMessages,
  usePostWhatsappMessages
} from '@/http/generated/hooks';

// O componente de mensagem que criamos anteriormente
import { MessageBubble } from './-components/message-bubble';
import { useQueryClient } from '@tanstack/react-query';
import { SendTemplateDialog } from './-components/send-template-dialog';
import { NewChatDialog } from './-components/new-chat-dialog';

export const Route = createFileRoute('/_app/whatsapp/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const queryClient = useQueryClient();

  // Ref para o scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2. Hook de Contatos (SEM refetchInterval)
  const { data: contacts = [], isLoading: isLoadingContacts, error: errorContacts } = useGetWhatsappContacts({
    query: {
      // Atualiza a lista a cada 10s para ver novos contatos/mensagens
      refetchInterval: 10000
    }
  });

  // 3. Hook de Mensagens (SEM refetchInterval)
  const { data: messages = [], isLoading: isLoadingMessages } = useGetWhatsappContactsContactIdMessages(
    selectedContactId as string,
    {
      query: {
        enabled: !!selectedContactId,
        refetchInterval: 5000,
      }
    }
  );

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Verifica se a janela está fechada
  // Se isWindowOpen for undefined (carregando), assumimos false por segurança ou true dependendo da UX
  const isWindowClosed = selectedContact ? !selectedContact.isWindowOpen : false;

  // 3. Mutação de Envio
  const { mutateAsync: sendMessage, isPending: isSending } = usePostWhatsappMessages({
    mutation: {
      onSuccess: async () => {
        setInputMessage("");
        await queryClient.invalidateQueries({ queryKey: getWhatsappContactsContactIdMessagesQueryKey(selectedContactId as string) })
      },
      onError: (error) => {
        console.error(error);
        toast.error("Falha ao enviar mensagem.");
      }
    }
  });

  // Função de scroll para o fundo
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Efeito para rolar quando as mensagens mudam ou troca de contato
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedContactId, isLoadingMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedContactId) return;

    try {
      await sendMessage({
        data: {
          type: "text",
          contactId: selectedContactId,
          message: inputMessage
        }
      });
      // O scroll automático via useEffect cuidará da rolagem
    } catch {
      // Erro tratado no hook
    }
  };

  if (errorContacts) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar contatos.</div>;
  }

  return (
    // CONTAINER PRINCIPAL: Define altura fixa e esconde o scroll geral da página
    <div className="flex h-[calc(100vh-120px)] overflow-hidden bg-background border rounded-lg m-4 shadow-sm">

      {/* --- SIDEBAR (Esquerda) --- */}
      <div className="w-80 flex flex-col border-r bg-muted/10">
        <div className="p-4 border-b flex-none">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas..." className="pl-8" />
          </div>
          <NewChatDialog onContactCreated={(contactId) => setSelectedContactId(contactId)} />
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
              <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</div>
            )}

            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={cn(
                  "flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors border-b border-border/50 w-full",
                  selectedContactId === contact.id && "bg-accent"
                )}
              >
                <Avatar>
                  <AvatarImage src={contact.profilePicUrl || undefined} />
                  <AvatarFallback>{(contact.pushName || contact.waId)?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium truncate text-sm">{contact.pushName || contact.waId}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {contact.lastMessageAt && format(new Date(contact.lastMessageAt), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1 h-4">
                    {contact.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* --- CHAT AREA (Direita) --- */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/50 overflow-hidden relative">
        {selectedContact ? (
          <>
            {/* 1. HEADER (Fixo, flex-none) */}
            <div className="flex-none p-3 border-b flex justify-between items-center bg-background px-6 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedContact.profilePicUrl || undefined} />
                  <AvatarFallback>{(selectedContact.pushName || selectedContact.waId)?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-sm">{selectedContact.pushName || selectedContact.waId}</h2>
                  <p className="text-xs text-muted-foreground">+{selectedContact.waId}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* 2. ÁREA DE MENSAGENS (flex-1, overflow-y-auto) */}
            {/* Nota: Usando div nativa em vez de ScrollArea para controle mais fácil do scroll-to-bottom */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100/50 dark:bg-slate-900/50">
              {isLoadingMessages ? (
                <div className="flex justify-center p-4 h-full items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-w-4xl mx-auto min-h-full justify-end">
                  {messages.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-10">
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
            <div className="flex-none p-4 bg-background border-t">
              {/* AVISO VISUAL DE JANELA FECHADA */}
              {isWindowClosed && (
                <div className="flex flex-col items-center gap-3 py-2 bg-yellow-50/50 rounded-lg border border-yellow-100 p-4">
                  <div className="flex items-center gap-2 text-yellow-700 text-sm">
                    <span className="font-semibold">⚠️ Sessão encerrada.</span>
                    <span>Você precisa usar um template para reabrir a conversa.</span>
                  </div>

                  {/* Aqui está o componente novo */}
                  <SendTemplateDialog
                    contactId={selectedContactId!}
                    disabled={true} // Passamos true para ele renderizar como botão grande
                  />
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex gap-2 max-w-4xl mx-auto items-center"
              >
                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground" disabled={isWindowClosed || isSending}>
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1" disabled={isWindowClosed || isSending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputMessage.trim() || isSending || isWindowClosed}
                  className={isWindowClosed ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Estado Vazio */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
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