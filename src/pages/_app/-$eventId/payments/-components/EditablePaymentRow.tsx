// src/components/EditablePaymentRow.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Check, Edit, X } from 'lucide-react'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableCell, TableRow } from '@/components/ui/table'

import { Member } from './columns'
import { DeletePaymentButton } from './delete-payment-button'

// Schema de validação para o formulário de pagamento
const paymentSchema = z.object({
  visionId: z.string().min(1, 'ID Vision é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que 0'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  payedAt: z.date(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

type EditablePaymentRowProps = {
  payment: Member['ticketPayments'][0]
  onSave: (id: string, data: PaymentFormData) => void
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  refetch: () => void
}

export const EditablePaymentRow: React.FC<EditablePaymentRowProps> = ({
  payment,
  onSave,
  isEditing,
  onEdit,
  onCancel,
  refetch,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      visionId: payment.visionId || '',
      amount: payment.amount,
      type: payment.type,
      payedAt: new Date(payment.payedAt),
    },
  })

  const onSubmit = (data: PaymentFormData) => {
    onSave(payment.id, data)
    onCancel()
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Controller
            name="visionId"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Input
                  placeholder="ID Vision"
                  {...field}
                  className={errors.visionId ? 'border-red-500' : ''}
                />
                {errors.visionId && (
                  <p className="text-xs text-red-500">
                    {errors.visionId.message}
                  </p>
                )}
              </div>
            )}
          />
        </TableCell>
        <TableCell>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500">
                    {errors.amount.message}
                  </p>
                )}
              </div>
            )}
          />
        </TableCell>
        <TableCell>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger
                    className={errors.type ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-xs text-red-500">{errors.type.message}</p>
                )}
              </div>
            )}
          />
        </TableCell>
        <TableCell>
          <Controller
            name="payedAt"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !field.value ? 'text-muted-foreground' : ''
                      } ${errors.payedAt ? 'border-red-500' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                {errors.payedAt && (
                  <p className="text-xs text-red-500">
                    {errors.payedAt.message}
                  </p>
                )}
              </div>
            )}
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit(onSubmit)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell>{payment.visionId}</TableCell>
      <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
      <TableCell>{payment.type === 'CASH' ? 'Dinheiro' : 'Pix'}</TableCell>
      <TableCell>
        {format(new Date(payment.payedAt), 'dd/MM/yyyy', { locale: ptBR })}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeletePaymentButton paymentId={payment.id} refetch={refetch} />
        </div>
      </TableCell>
    </TableRow>
  )
}
