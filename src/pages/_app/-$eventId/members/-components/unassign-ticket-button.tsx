'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getEventDashboardDataByIdQueryKey,
  getEventMemberByIdQueryKey,
  getEventMembersQueryKey,
  getEventTicketsQueryKey,
  useUnassignTicket,
} from '@/http/generated';

type IProps = {
  id: string;
  isDelivered: boolean;
  memberId: string;
};

export function UnassignTicketButton({ id, isDelivered, memberId }: IProps) {
  const eventId = useParams({
    strict: false,
  }).eventId as string;

  const queryClient = useQueryClient();
  const { mutateAsync: unassignTicket, isPending: isPendingTicket } =
    useUnassignTicket({
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getEventMembersQueryKey(eventId),
          });
          await queryClient.invalidateQueries({
            queryKey: getEventMemberByIdQueryKey(eventId, memberId),
          });
          await queryClient.invalidateQueries({
            queryKey: getEventTicketsQueryKey(eventId),
          });
          await queryClient.invalidateQueries({
            queryKey: getEventDashboardDataByIdQueryKey(eventId),
          });

          toast.success('Ingresso desvinculado com sucesso');
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    });

  async function handleUnassignTicket() {
    await unassignTicket({
      eventId,
      ticketId: id,
    });
  }

  return (
    <Button
      disabled={isDelivered || isPendingTicket}
      onClick={handleUnassignTicket}
    >
      {isPendingTicket ? <Loader2 className="animate-spin" /> : 'Desvincular'}
    </Button>
  );
}
