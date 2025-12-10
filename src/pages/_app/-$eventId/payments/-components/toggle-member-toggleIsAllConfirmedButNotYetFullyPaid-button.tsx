import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/lib/trpc/react'

export function ToggleIsAllConfirmedButNotYetFullyPaidButton({
  memberId,
  refetch,
  isAllConfirmedButNotYetFullyPaid,
}: {
  memberId: string
  refetch: () => void
  isAllConfirmedButNotYetFullyPaid: boolean
}) {
  const { toast } = useToast()
  const toggleIsAllConfirmedButNotYetFullyPaid =
    trpc.toggleIsAllConfirmedButNotYetFullyPaid.useMutation({
      onSuccess: () => {
        toast({
          title: 'Status do membro atualizado com sucesso',
        })
        refetch()
      },
      onError: (error) => {
        toast({
          title: 'Erro ao atualizar status do membro',
          description: error.message,
          variant: 'destructive',
        })
      },
    })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">
          {!isAllConfirmedButNotYetFullyPaid
            ? 'Contabilizar'
            : 'Não contabilizar'}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              Tem certeza que deseja{' '}
              {isAllConfirmedButNotYetFullyPaid
                ? 'não contabilizar'
                : 'contabilizar'}{' '}
              este pagamento?
            </h4>
          </div>
          <Button
            variant="destructive"
            onClick={() =>
              toggleIsAllConfirmedButNotYetFullyPaid.mutate({ id: memberId })
            }
            disabled={toggleIsAllConfirmedButNotYetFullyPaid.isPending}
          >
            {isAllConfirmedButNotYetFullyPaid
              ? 'Não contabilizar'
              : 'Contabilizar'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
