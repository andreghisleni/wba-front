import { useNavigate } from '@tanstack/react-router';

import { BookOpenIcon, LogOutIcon, PinIcon, UserPenIcon } from 'lucide-react';

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
import { useSendRedded } from '@/contexts/send-redded';
import { auth } from '@/lib/auth';
import { getNameInitials } from '@/utils/get-name-initials';

export default function UserMenu() {
  // const { eventId } = useParams({
  //   strict: false,
  // });

  const navigate = useNavigate();
  const { data } = auth.useSession();
  async function handleLogout() {
    await auth.signOut();
    navigate({
      to: '/sign-in',
      replace: true,
    });
  }

  const { sendRedded, setSendRedded } = useSendRedded();

  if (!data) {
    return <div>Loading...</div>;
  }

  const user = data.user;

  const initials = getNameInitials(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-auto p-0 hover:bg-transparent" variant="ghost">
          <Avatar>
            <AvatarImage alt={user.name} src={user.image || ''} />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground text-sm">
            {user.name}
          </span>
          <span className="truncate font-normal text-muted-foreground text-xs">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* {eventId && (<DropdownMenuItem asChild>
            <Link params={{ eventId }} to={'/$eventId/event/edit'}>
              <BoltIcon aria-hidden="true" className="opacity-60" size={16} />
              <span>Evento</span>
            </Link>
          </DropdownMenuItem>)} */}
          <DropdownMenuItem onClick={() => setSendRedded((old) => !old)}>
            <WhatsAppTicks
              aria-hidden="true"
              className={`${sendRedded ? '' : 'text-destructive'} opacity-60`}
              disabled={!sendRedded}
              size={16}
            />
            <span>
              {sendRedded ? 'Marcar como lido' : 'Não marcar como lido'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BookOpenIcon aria-hidden="true" className="opacity-60" size={16} />
            <span>Option 3</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PinIcon aria-hidden="true" className="opacity-60" size={16} />
            <span>Option 4</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPenIcon aria-hidden="true" className="opacity-60" size={16} />
            <span>Option 5</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon aria-hidden="true" className="opacity-60" size={16} />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WhatsAppTicks({
  size = 16,
  disabled = false,
  className = '',
  ...props
}: {
  size?: number;
  disabled?: boolean;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 20 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>WhatsApp Ticks</title>
      <path
        d="M3 11l2 2l5-6"
        stroke="#34B7F1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7 11l2 2l6-7"
        stroke="#34B7F1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      {disabled ? (
        <path
          d="M3 3l14 14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      ) : null}
    </svg>
  );
}
