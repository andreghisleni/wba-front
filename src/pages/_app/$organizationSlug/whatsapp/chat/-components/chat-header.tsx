import { MoreVertical, Phone, Tag } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GetWhatsappContactsQueryResponse } from '@/http/generated/types/GetWhatsappContacts';
import { cn } from '@/lib/utils';
import { cssColors } from '../../../tags/-components/colors';
import { ContactTagForm } from './contact-tag-dialog';
import { PhoneComponent } from './phone';

interface ChatHeaderProps {
  selectedContact: GetWhatsappContactsQueryResponse['data'][0];
}

export function ChatHeader({ selectedContact }: ChatHeaderProps) {
  const [open, setOpen] = useState(false);
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
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">
              {selectedContact.pushName ||
                PhoneComponent({ phone: selectedContact.waId })}
            </h2>
            {selectedContact.tag && (
              <span
                className={cn(
                  `inline-flex items-center rounded-full px-2 py-1 font-medium text-xs ${selectedContact.tag.color}`,
                  cssColors[
                  selectedContact.tag.color as keyof typeof cssColors
                  ] ||
                  'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100'
                )}
              >
                {selectedContact.tag.name}
              </span>
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            <PhoneComponent phone={selectedContact.waId} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button disabled size="icon" variant="ghost">
          <Phone className="h-4 w-4" />
        </Button>
        {/* <Button size="icon" variant="ghost">
          <MoreVertical className="h-4 w-4" />
        </Button> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-64">
            <DropdownMenuLabel>Opções</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* <DropdownMenuItem>
                <BookOpenIcon aria-hidden="true" className="opacity-60" size={16} />
                <span>Option 3</span>
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Tag aria-hidden="true" className="opacity-60" size={16} />
                <span>Tag</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ContactTagForm
          clientId={selectedContact.id}
          isOpen={open}
          setIsOpen={setOpen}
          tagId={selectedContact.tag?.id}
        />
      </div>
    </div>
  );
}
