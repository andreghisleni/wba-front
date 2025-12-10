import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Check, Edit, X } from 'lucide-react';
import type React from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import type { GetEventMemberById200 } from '@/http/generated';
import { DeletePaymentButton } from './delete-payment-button';

// Schema de validação para o formulário de pagamento
const paymentSchema = z.object({
  visionId: z.string().min(1, 'ID Vision é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que 0'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  payedAt: z.date(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

type EditablePaymentRowProps = {
  payment: NonNullable<GetEventMemberById200>['payments'][0];
  onSave: (id: string, data: PaymentFormData) => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  memberId: string;
};

export const EditablePaymentRow: React.FC<EditablePaymentRowProps> = ({
  payment,
  onSave,
  isEditing,
  onEdit,
  onCancel,
  memberId,
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
  });

  const onSubmit = (data: PaymentFormData) => {
    onSave(payment.id, data);
    onCancel();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Controller
            control={control}
            name="visionId"
            render={({ field }) => (
              <div className="space-y-1">
                <Input
                  placeholder="ID Vision"
                  {...field}
                  className={errors.visionId ? 'border-red-500' : ''}
                />
                {errors.visionId && (
                  <p className="text-red-500 text-xs">
                    {errors.visionId.message}
                  </p>
                )}
              </div>
            )}
          />
        </TableCell>
        <TableCell>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <div className="space-y-1">
                <Input
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  {...field}
                  className={errors.amount ? 'border-red-500' : ''}
                  onChange={(e) =>
                    field.onChange(Number.parseFloat(e.target.value))
                  }
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs">
                    {errors.amount.message}
                  </p>
                )}
              </div>
            )}
          />
        </TableCell>
        <TableCell>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="space-y-1">
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
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
                  <p className="text-red-500 text-xs">{errors.type.message}</p>
                )}
              </div>
            )}
          />
        </TableCell>
        <TableCell>
          <Controller
            control={control}
            name="payedAt"
            render={({ field }) => (
              <div className="space-y-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className={`w-full justify-start text-left font-normal ${
                        field.value ? '' : 'text-muted-foreground'
                      } ${errors.payedAt ? 'border-red-500' : ''}`}
                      variant="outline"
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
                      initialFocus
                      locale={ptBR}
                      mode="single"
                      onSelect={field.onChange}
                      selected={field.value}
                    />
                  </PopoverContent>
                </Popover>
                {errors.payedAt && (
                  <p className="text-red-500 text-xs">
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
              className="h-8 w-8 p-0"
              onClick={handleSubmit(onSubmit)}
              size="sm"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={handleCancel}
              size="sm"
              variant="outline"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
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
            className="h-8 w-8 p-0"
            onClick={onEdit}
            size="sm"
            variant="outline"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeletePaymentButton memberId={memberId} paymentId={payment.id} />
        </div>
      </TableCell>
    </TableRow>
  );
};
