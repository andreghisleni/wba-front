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
import { getBroadcastListMembersQueryKey, getBroadcastListQueryKey, getBroadcastListsQueryKey, useDeleteBroadcastListMember } from '@/http/generated';

export function DeleteMemberButton({
  memberId,
}: {
  memberId: string;
}) {
  const listId = useParams({
    strict: false,
  }).listId as string;
  const queryClient = useQueryClient();

  const deleteMember = useDeleteBroadcastListMember({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListMembersQueryKey(listId),
        });
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListQueryKey(listId),
        });
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListsQueryKey(),
        });

        toast.success('Membro deletado com sucesso');
      },
      onError: (error) => {
        // biome-ignore lint/suspicious/noConsole: here
        console.error('Erro ao deletar membro:', error);
        toast.error('Erro ao deletar membro', {
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
              Tem certeza que deseja deletar este membro?
            </h4>
            <p className="text-muted-foreground text-sm">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <Button
            disabled={deleteMember.isPending}
            onClick={() => deleteMember.mutate({ listId, id: memberId })}
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
