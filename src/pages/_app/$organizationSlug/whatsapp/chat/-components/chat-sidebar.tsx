import { format } from 'date-fns';
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  HelpCircle,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  type LucideProps,
  MousePointer2,
  Search,
  Sticker,
  Video,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GetWhatsappContacts200 } from '@/http/generated';
import { cn } from '@/lib/utils';
import { MessageStatus } from './message-status';
import { NewChatDialog } from './new-chat-dialog';

const typeIcons: Record<
  string,
  React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >
> = {
  image: ImageIcon,
  video: Video,
  audio: AudioLines,
  document: FileText,
  sticker: Sticker,
  interactive: MousePointer2,
  template: LayoutTemplate,
  unknown: HelpCircle,
};

const typeLabels: Record<string, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  document: 'Documento',
  sticker: 'Figurinha',
  interactive: 'Interativo',
  template: 'Modelo',
  unknown: 'Desconhecido',
};

// Tipo do contato individual (vai ser atualizado pelo Kubb)
type ContactItem = {
  id: string;
  pushName: string;
  waId: string;
  profilePicUrl: string | null;
  unreadCount: number;
  lastMessage: string;
  lastMessageType: string;
  lastMessageStatus?: string;
  lastMessageAt: string | number;
  isWindowOpen: boolean;
};

interface ChatSidebarProps {
  contacts: ContactItem[];
  isLoadingContacts: boolean;
  selectedContactId: string | null;
  onSelectContact: (contact: GetWhatsappContacts200['data'][0]) => void;
  // Filtros controlados pelo pai
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showUnreadOnly: boolean;
  onUnreadFilterChange: (value: boolean) => void;
  // Paginação
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ChatSidebar({
  contacts,
  isLoadingContacts,
  selectedContactId,
  onSelectContact,
  searchTerm,
  onSearchChange,
  showUnreadOnly,
  onUnreadFilterChange,
  page,
  totalPages,
  onPageChange,
}: ChatSidebarProps) {
  return (
    <div className="flex w-80 flex-col border-r bg-muted/10">
      <div className="flex flex-none flex-row items-center gap-2 border-b p-4">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            value={searchTerm}
          />
          {searchTerm && (
            <button
              className="absolute top-2.5 right-2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange('')}
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
          onClick={() => onUnreadFilterChange(!showUnreadOnly)}
          size="icon"
          title={showUnreadOnly ? 'Mostrar todos' : 'Filtrar não lidas'}
          variant={showUnreadOnly ? 'secondary' : 'ghost'}
        >
          <Filter className="h-4 w-4" />
        </Button>

        <NewChatDialog
          onContactCreated={(contact) => onSelectContact(contact)}
        />
      </div>

      <div className="w-full flex-1 overflow-auto">
        <div className="flex flex-col">
          {isLoadingContacts && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingContacts && contacts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground text-sm">
              <Search className="h-8 w-8 opacity-20" />
              <p>Nenhuma conversa encontrada.</p>
              {showUnreadOnly && (
                <Button
                  className="h-auto p-0 text-xs"
                  onClick={() => onUnreadFilterChange(false)}
                  variant="link"
                >
                  Ver todas as conversas
                </Button>
              )}
            </div>
          )}

          {contacts.map((contact) => (
            <button
              className={cn(
                'flex w-full items-center gap-3 border-border/50 border-b p-4 text-left transition-colors hover:bg-accent',
                selectedContactId === contact.id && 'bg-accent'
              )}
              key={contact.id}
              onClick={() => onSelectContact(contact)}
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
                  <div className="flex h-4 min-w-0 flex-1 items-center gap-1 text-muted-foreground text-xs">
                    {contact.lastMessageStatus && (
                      <MessageStatus
                        isUser={true}
                        status={contact.lastMessageStatus}
                      />
                    )}
                    {(() => {
                      const type = (
                        contact.lastMessageType || ''
                      ).toLowerCase();
                      if (type === 'text') {
                        return (
                          <span className="min-w-0 flex-1 truncate">
                            {contact.lastMessage}
                          </span>
                        );
                      }

                      const Icon = typeIcons[type] || HelpCircle;
                      const label =
                        contact.lastMessage || typeLabels[type] || 'Mensagem';

                      return (
                        <div className="flex min-w-0 flex-1 items-center gap-1">
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="min-w-0 truncate">{label}</span>
                        </div>
                      );
                    })()}
                  </div>

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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-none items-center justify-between border-t px-4 py-2">
          <Button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground text-xs">
            {page} / {totalPages}
          </span>
          <Button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            size="sm"
            variant="ghost"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
