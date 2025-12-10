// src/components/member-payments-table-modal.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type GetEventMemberById200,
  getAllEventPaymentsQueryKey,
  getEventDashboardDataByIdQueryKey,
  getEventMemberByIdQueryKey,
  useUpdateEventPaymentById,
} from '@/http/generated';
import { cn } from '@/lib/utils';
import { formatToBRL } from '@/utils/formatToBRL';
import { TicketPaymentForm } from '../../../payments/-components/ticket-payment-form';
import { EditablePaymentRow, type PaymentFormData } from './EditablePaymentRow';

type PaymentsTableProps = {
  memberId: string;
  payments: NonNullable<GetEventMemberById200>['payments'];
  toReceive: number;
};

export function PaymentsTable({
  memberId,
  payments,
  toReceive,
}: PaymentsTableProps) {
  const eventId = useParams({
    strict: false,
  }).eventId as string;
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Exemplo de mutação para atualizar um pagamento
  const updatePaymentMutation = useUpdateEventPaymentById({
    mutation: {
      onSuccess: async () => {
        /*...getEventPaymentByIdQueryKey(eventId)*/

        await queryClient.invalidateQueries({
          queryKey: getEventMemberByIdQueryKey(eventId, memberId),
        });
        await queryClient.invalidateQueries({
          queryKey: getAllEventPaymentsQueryKey(eventId),
        });
        await queryClient.invalidateQueries({
          queryKey: getEventDashboardDataByIdQueryKey(eventId),
        });

        toast.success('Pagamento atualizado com sucesso');
      },
      onError: (error) => {
        // biome-ignore lint/suspicious/noConsole: here
        console.error('Erro ao atualizar pagamento:', error);
        toast.error('Erro ao atualizar pagamento', {
          description: error.response?.data?.message,
        });
      },
    },
  });

  const handleUpdatePayment = (paymentId: string, data: PaymentFormData) => {
    // console.log('Atualizando pagamento:', paymentId, data);
    updatePaymentMutation.mutate({
      id: paymentId,
      eventId,
      data: {
        amount: data.amount,
        type: data.type as 'CASH' | 'PIX',
        payedAt: data.payedAt.toISOString(),
        visionId: data.visionId,
        memberId,
      },
    });
  };

  const handleEdit = (paymentId: string) => {
    setEditingPaymentId(paymentId);
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
  };

  const received = payments.reduce(
    (acc: number, payment: { amount: number }) => acc + payment.amount,
    0
  );

  const total = received - toReceive;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <div className="flex">
          <TicketPaymentForm memberId={memberId} />
        </div>
      </div>
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
              <TableCell className="text-center" colSpan={5}>
                Nenhum pagamento encontrado para este membro.
              </TableCell>
            </TableRow>
          ) : (
            payments?.map((payment) => (
              <EditablePaymentRow
                isEditing={editingPaymentId === payment.id}
                key={payment.id}
                memberId={memberId}
                onCancel={handleCancelEdit}
                onEdit={() => handleEdit(payment.id)}
                onSave={handleUpdatePayment}
                payment={payment}
              />
            ))
          )}
          <TableRow
            className={cn('', total < 0 && 'bg-red-100 dark:bg-red-900')}
          >
            <TableCell className="text-right">Total Recebido:</TableCell>
            <TableCell className="font-bold">{formatToBRL(received)}</TableCell>
            <TableCell className="text-right">Total a Receber:</TableCell>
            <TableCell className="font-bold">
              {formatToBRL(toReceive)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right font-bold">
              Saldo: {formatToBRL(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}
