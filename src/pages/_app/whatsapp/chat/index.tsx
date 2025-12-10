import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MoreVertical, Paperclip, Phone, Search, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Importando os hooks gerados pelo Kubb
// Ajuste o caminho conforme sua estrutura (src/http/generated/hooks)
import {
  useGetWhatsappContacts,
  useGetWhatsappContactsContactIdMessages,
  usePostWhatsappMessages
} from '@/http/generated/hooks';


export const Route = createFileRoute('/_app/whatsapp/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");

  // 1. Hook para Listar Contatos (Inbox)
  // O TanStack Query já gerencia loading, error e cache
  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    error: errorContacts
  } = useGetWhatsappContacts({
    query: {
      // Atualiza a lista a cada 10s para ver novos contatos/mensagens
      refetchInterval: 10000
    }
  });

  // Encontra o objeto do contato selecionado baseado no ID
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // 2. Hook para Listar Mensagens
  // Só dispara se houver um selectedContactId (enabled: !!id)
  const {
    data: messages = [],
    isLoading: isLoadingMessages
  } = useGetWhatsappContactsContactIdMessages(
    selectedContactId as string, // contactId
    {
      query: {
        enabled: !!selectedContactId, // Só busca se tiver ID
        refetchInterval: 5000, // Polling de mensagens a cada 5s
      }
    }
  );

  // 3. Hook de Mutação para Enviar Mensagem
  const { mutateAsync: sendMessage, isPending: isSending } = usePostWhatsappMessages({
    mutation: {
      onSuccess: () => {
        setInputMessage("");
        // Opcional: Invalidar a query de mensagens para forçar atualização imediata
        // queryClient.invalidateQueries({ queryKey: ... }) 
        // Mas o polling ou o retorno da mutação já ajudam.
      },
      onError: (error) => {
        console.error(error);
        toast.error("Falha ao enviar mensagem.");
      }
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedContactId) return;

    try {
      await sendMessage({
        data: {
          contactId: selectedContactId,
          message: inputMessage
        }
      });
    } catch {
      // Erro já tratado no onError do hook
    }
  };

  if (errorContacts) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar contatos.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background border rounded-lg m-4 shadow-sm">

      {/* --- SIDEBAR: Lista de Contatos --- */}
      <div className="w-80 flex flex-col border-r bg-muted/10">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas..." className="pl-8" />
          </div>
        </div>

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
                  "flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors border-b border-border/50",
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

      {/* --- MAIN: Janela de Chat --- */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/50">
        {selectedContact ? (
          <>
            {/* Header do Chat */}
            <div className="p-3 border-b flex justify-between items-center bg-background px-6 shadow-sm z-10">
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

            {/* Área de Mensagens (Scrollable) */}
            <ScrollArea className="flex-1 p-4 bg-slate-100/50 dark:bg-slate-900/50">
              {isLoadingMessages ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                  {messages.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-10">
                      Inicie a conversa...
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isOut = msg.direction === "OUTBOUND";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex w-max max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm",
                          isOut
                            ? "ml-auto bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-white dark:bg-slate-800 rounded-tl-none border"
                        )}
                      >
                        {msg.type === "image" ? (
                          // SE FOR IMAGEM
                          <div className="mb-1">
                            <img
                              src={String(msg.mediaUrl).replace('https://pub-a72a6f120019167e519d34db3c3c75b5.r2.dev/', 'http://localhost:8787/')}
                              alt="Foto enviada"
                              className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90"
                              onClick={() => window.open(String(msg.mediaUrl).replace('https://pub-a72a6f120019167e519d34db3c3c75b5.r2.dev/', 'http://localhost:8787/'), '_blank')} // Abre original ao clicar
                            />
                            {/* Se tiver legenda (body), mostra embaixo da foto */}
                            {msg.body && <p className="mt-1 text-sm">{msg.body}</p>}
                          </div>
                        ) : (
                          // SE FOR TEXTO NORMAL
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        )}
                        <span className={cn("text-[10px] self-end opacity-70", isOut ? "text-primary-foreground/90" : "text-muted-foreground")}>
                          {msg.timestamp && format(new Date(msg.timestamp), "HH:mm")}
                          {isOut && <span className="ml-1 text-[10px] font-bold">
                            {msg.status === 'READ' ? '✓✓' : msg.status === 'DELIVERED' ? '✓✓' : '✓'}
                          </span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input de Envio */}
            <div className="p-4 bg-background border-t">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex gap-2 max-w-4xl mx-auto items-center"
              >
                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1"
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={!inputMessage.trim() || isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Estado Vazio (Nenhuma conversa selecionada) */
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