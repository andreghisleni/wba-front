import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  getEventDashboardDataByIdQueryKey,
  getEventMembersQueryKey,
  getEventTicketsQueryKey,
  useGenerateEventTickets,
} from '@/http/generated';

export function ConnectTicketsToMembersButton({
  eventId,
}: {
  eventId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useGenerateEventTickets({
    mutation: {
      onSuccess: async () => {
        setOpen(false);
        toast.success('Tickets gerados com sucesso');
        await queryClient.invalidateQueries({
          queryKey: getEventMembersQueryKey(eventId),
        });
        await queryClient.invalidateQueries({
          queryKey: getEventTicketsQueryKey(eventId),
        });
        await queryClient.invalidateQueries({
          queryKey: getEventDashboardDataByIdQueryKey(eventId),
        });
      },
      onError: () => {
        toast.error('Erro ao gerar tickets');
      },
    },
  });

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button variant="outline">Conectar Tickets</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              Conectar Tickets aos Membros
            </h4>
            <Button
              className="mt-4"
              color="emerald"
              disabled={isPending}
              onClick={() => mutate({ eventId })}
            >
              {isPending ? 'Gerando...' : 'Gerar Tickets'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
