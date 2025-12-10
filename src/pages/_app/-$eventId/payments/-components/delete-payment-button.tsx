import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/lib/trpc/react'

export function DeletePaymentButton({
  paymentId,
  refetch,
}: {
  paymentId: string
  refetch: () => void
}) {
  const { toast } = useToast()
  const deletePayment = trpc.deleteTicketPayment.useMutation({
    onSuccess: () => {
      toast({
        title: 'Pagamento deletado com sucesso',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Erro ao deletar pagamento',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              Tem certeza que deseja deletar este pagamento?
            </h4>
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => deletePayment.mutate({ id: paymentId })}
            disabled={deletePayment.isPending}
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
