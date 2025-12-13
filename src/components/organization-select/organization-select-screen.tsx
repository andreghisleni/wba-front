import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { auth } from '@/lib/auth';
import { OrganizationFormDialog } from './organization-form-dialog';

export function OrganizationSelectScreen() {
  const [open, setOpen] = useState<boolean>(true);
  const { data: organizations, isPending: isLoading } =
    auth.useListOrganizations();
  const { data: activeOrg } = auth.useActiveOrganization();

  async function handleSelect(orgId: string) {
    await auth.organization.setActive({
      organizationId: orgId,
    });
    toast.success('Organização selecionada');
    setOpen(false);
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open} showCloseButton={false}>
      <CommandInput placeholder="Procurar organização..." />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Carregando...' : 'Nenhuma organização encontrada.'}
        </CommandEmpty>
        <CommandGroup heading="Organizações">
          {organizations?.map((org) => (
            <CommandItem
              key={org.id}
              onSelect={() => handleSelect(org.id)}
              value={org.name}
            >
              {org.name}
              {activeOrg?.id === org.id && (
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
    </CommandDialog>
  );
}
