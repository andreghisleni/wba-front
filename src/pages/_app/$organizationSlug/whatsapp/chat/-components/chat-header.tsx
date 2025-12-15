import { MoreVertical, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { GetWhatsappContactsQueryResponse } from '@/http/generated/types/GetWhatsappContacts';
import { PhoneComponent } from './phone';

interface ChatHeaderProps {
  selectedContact: GetWhatsappContactsQueryResponse[0];
}

export function ChatHeader({ selectedContact }: ChatHeaderProps) {
  return (
    <div className="z-10 flex flex-none items-center justify-between border-b bg-background p-3 px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={selectedContact.profilePicUrl || undefined} />
          <AvatarFallback>
            {selectedContact.pushName?.substring(0, 2).toUpperCase() ||
              PhoneComponent({ phone: selectedContact.waId })}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-sm">
            {selectedContact.pushName || PhoneComponent({ phone: selectedContact.waId })}
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
  );
}
