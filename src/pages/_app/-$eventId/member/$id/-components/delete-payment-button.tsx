import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  getAllEventPaymentsQueryKey,
  getEventDashboardDataByIdQueryKey,
  getEventMemberByIdQueryKey,
  useDeleteEventPaymentById,
} from '@/http/generated';

export function DeletePaymentButton({
  paymentId,
  memberId,
}: {
  paymentId: string;
  memberId: string;
}) {
  const eventId = useParams({
    strict: false,
  }).eventId as string;
  const queryClient = useQueryClient();

  const deletePayment = useDeleteEventPaymentById({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getEventMemberByIdQueryKey(eventId, memberId),
        });
        await queryClient.invalidateQueries({
          queryKey: getAllEventPaymentsQueryKey(eventId),
        });
        await queryClient.invalidateQueries({
          queryKey: getEventDashboardDataByIdQueryKey(eventId),
        });

        toast.success('Pagamento deletado com sucesso');
      },
      onError: (error) => {
        // biome-ignore lint/suspicious/noConsole: here
        console.error('Erro ao deletar pagamento:', error);
        toast.error('Erro ao deletar pagamento', {
          description: error.response.data.message,
        });
      },
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              Tem certeza que deseja deletar este pagamento?
            </h4>
            <p className="text-muted-foreground text-sm">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <Button
            disabled={deletePayment.isPending}
            onClick={() => deletePayment.mutate({ eventId, id: paymentId })}
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
