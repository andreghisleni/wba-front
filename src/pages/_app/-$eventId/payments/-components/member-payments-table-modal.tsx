// src/components/member-payments-table-modal.tsx
'use client'

import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/lib/trpc/react'

import { Member } from './columns'
import { EditablePaymentRow, PaymentFormData } from './EditablePaymentRow'

type MemberPaymentsTableModalProps = {
  memberId: string
  memberName: string
  refetchMembers: () => void
  payments: Member['ticketPayments']
  visionId: string
}

export const MemberPaymentsTableModal: React.FC<
  MemberPaymentsTableModalProps
> = ({ memberId, memberName, refetchMembers, payments, visionId }) => {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)

  // Exemplo de mutação para atualizar um pagamento
  const updatePaymentMutation = trpc.updateTicketPayment.useMutation({
    onSuccess: () => {
      refetchMembers()
      toast({
        title: 'Pagamento atualizado com sucesso',
        description: 'O pagamento foi atualizado corretamente.',
      })
    },
    onError: (error) => {
      console.error('Erro ao atualizar pagamento:', error)
      toast({
        title: 'Erro ao atualizar pagamento',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleUpdatePayment = (paymentId: string, data: PaymentFormData) => {
    console.log('Atualizando pagamento:', paymentId, data)
    updatePaymentMutation.mutate({
      id: paymentId,
      amount: data.amount,
      type: data.type as 'CASH' | 'PIX',
      payedAt: data.payedAt,
      visionId: data.visionId,
      memberId,
    })
  }

  const handleEdit = (paymentId: string) => {
    setEditingPaymentId(paymentId)
  }

  const handleCancelEdit = () => {
    setEditingPaymentId(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1"
          color="emerald"
        >
          Pagamentos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>
            Pagamentos de: {visionId} -{' '}
            <strong className="font-extrabold">{memberName}</strong>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do Pagamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhum pagamento encontrado para este membro.
                  </TableCell>
                </TableRow>
              ) : (
                payments?.map((payment) => (
                  <EditablePaymentRow
                    key={payment.id}
                    payment={payment}
                    onSave={handleUpdatePayment}
                    isEditing={editingPaymentId === payment.id}
                    onEdit={() => handleEdit(payment.id)}
                    onCancel={handleCancelEdit}
                    refetch={refetchMembers}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
