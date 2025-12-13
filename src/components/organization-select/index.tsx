import { useLocation, useNavigate, useParams } from '@tanstack/react-router';
import { CheckIcon, ChevronDownIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { OrganizationFormDialog } from './organization-form-dialog';
import { OrganizationSelectScreen } from './organization-select-screen';

export function OrganizationSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organizationSlug } = useParams({ strict: false });
  const [open, setOpen] = useState<boolean>(false);

  const { data: organizations, isPending: isLoading } =
    auth.useListOrganizations();
  const { data: activeOrg, isPending } = auth.useActiveOrganization();

  async function handleSelect(orgId: string) {
    const selectedOrg = organizations?.find((o) => o.id === orgId);
    if (!selectedOrg) return;

    await auth.organization.setActive({
      organizationId: orgId,
    });

    if (organizationSlug) {
      const newPath = location.pathname.replace(
        organizationSlug,
        selectedOrg.slug
      );
      await navigate({ to: newPath });
    } else {
      await navigate({ to: `/${selectedOrg.slug}/dashboard` });
    }

    toast.success('Organização selecionada');
    setOpen(false);
  }

  const withoutOrganizationRoute = location.pathname.startsWith('/sessions');

  const currentOrganizationId = activeOrg?.id;

  if (isPending) {
    return <Skeleton className="h-8 w-48 rounded-full" />;
  }

  return (
    <>
      {!(currentOrganizationId || withoutOrganizationRoute) && (
        <OrganizationSelectScreen />
      )}
      <div className="*:not-first:mt-2">
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            <Button
              aria-expanded={open}
              className="w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]"
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Skeleton className="h-[20px] w-[100px] rounded-full" />
              ) : (
                <span
                  className={cn(
                    'truncate',
                    !currentOrganizationId && 'text-muted-foreground'
                  )}
                >
                  {currentOrganizationId
                    ? organizations?.find(
                      (organization) =>
                        organization.id === currentOrganizationId
                    )?.name
                    : 'Select an organization'}
                </span>
              )}
              {isLoading ? (
                <Loader2
                  className="animate-spin text-muted-foreground/80"
                  size={16}
                />
              ) : (
                <ChevronDownIcon
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground/80"
                  size={16}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
          >
            <Command>
              <CommandInput placeholder="Find organization" />
              <CommandList>
                <CommandEmpty>No organization found.</CommandEmpty>
                <CommandGroup>
                  {organizations?.map((organization) => (
                    <CommandItem
                      key={organization.id}
                      onSelect={(currentValue) => {
                        handleSelect(currentValue);
                        setOpen(false);
                      }}
                      value={organization.id}
                    >
                      {organization.name}
                      {currentOrganizationId === organization.id && (
                        <CheckIcon className="ml-auto" size={16} />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <OrganizationFormDialog />
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
