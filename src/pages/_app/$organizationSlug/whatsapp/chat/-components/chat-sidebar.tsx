import { format } from 'date-fns';
import { Filter, Loader2, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GetWhatsappContactsQueryResponse } from '@/http/generated/types/GetWhatsappContacts';
import { cn } from '@/lib/utils';
import { NewChatDialog } from './new-chat-dialog';

interface ChatSidebarProps {
  contacts: GetWhatsappContactsQueryResponse;
  isLoadingContacts: boolean;
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
}

export function ChatSidebar({
  contacts,
  isLoadingContacts,
  selectedContactId,
  onSelectContact,
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (contact.pushName || '')
      .toLowerCase()
      .includes(searchLower);
    const phoneMatch = (contact.waId || '').includes(searchLower);
    const matchesSearch = nameMatch || phoneMatch;
    const matchesUnread = showUnreadOnly ? contact.unreadCount > 0 : true;
    return matchesSearch && matchesUnread;
  });

  return (
    <div className="flex w-80 flex-col border-r bg-muted/10">
      <div className="flex flex-none flex-row items-center gap-2 border-b p-4">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            value={searchTerm}
          />
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
          onContactCreated={(contactId) => onSelectContact(contactId)}
        />
      </div>

      <div className="w-full overflow-auto">
        <div className="flex flex-col">
          {isLoadingContacts && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingContacts && filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground text-sm">
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
              onClick={() => onSelectContact(contact.id)}
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
                  <p className="h-4 flex-1 truncate text-muted-foreground text-xs">
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
  );
}
