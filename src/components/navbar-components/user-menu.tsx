import { useNavigate } from "@tanstack/react-router";

import {
  BookOpenIcon,
  Layers2Icon,
  LogOutIcon,
  PinIcon,
  UserPenIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";
import { getNameInitials } from "@/utils/get-name-initials";

export default function UserMenu() {
  // const { eventId } = useParams({
  //   strict: false,
  // });

  const navigate = useNavigate();
  const { data } = auth.useSession();
  async function handleLogout() {
    await auth.signOut();
    navigate({
      to: "/sign-in",
      replace: true,
    });
  }

  // biome-ignore lint/style/useBlockStatements: <explanation>
  if (!data) return <div>Loading...</div>;

  const user = data.user;

  const initials = getNameInitials(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-auto p-0 hover:bg-transparent" variant="ghost">
          <Avatar>
            <AvatarImage alt={user.name} src={user.image || ""} />
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
          <DropdownMenuItem>
            <Layers2Icon aria-hidden="true" className="opacity-60" size={16} />
            <span>Option 2</span>
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
