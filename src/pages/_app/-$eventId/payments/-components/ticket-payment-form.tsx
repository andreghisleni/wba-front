'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import {
  getAllEventPaymentsQueryKey,
  getEventDashboardDataByIdQueryKey,
  getEventMemberByIdQueryKey,
  useCreateEventPayment,
} from '@/http/generated';
import { cn } from '@/lib/utils';

const ticketPaymentCreateSchema = z.object({
  visionId: z.string().optional(),
  amount: z.coerce
    .number({
      required_error: 'O valor é obrigatório',
      invalid_type_error: 'O valor deve ser um número',
    })
    .min(0.01, 'O valor deve ser maior que zero'),
  type: z.enum(['CASH', 'PIX'], {
    required_error: 'O tipo de pagamento é obrigatório',
  }),
  payedAt: z.date({
    required_error: 'A data de pagamento é obrigatória',
    invalid_type_error: 'A data de pagamento é inválida',
  }),
});

export function TicketPaymentForm({ memberId }: { memberId: string }) {
  const eventId = useParams({
    strict: false,
  }).eventId as string;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof ticketPaymentCreateSchema>>({
    resolver: zodResolver(ticketPaymentCreateSchema),
    defaultValues: {
      payedAt: new Date(),
      type: 'PIX', // Default value for type
    },
  });

  const createTicketPayment = useCreateEventPayment({
    mutation: {
      onSuccess: async () => {
        form.reset();
        setIsOpen(false);

        await queryClient.invalidateQueries({
          queryKey: getEventMemberByIdQueryKey(eventId, memberId),
        });
        await queryClient.invalidateQueries({
          queryKey: getAllEventPaymentsQueryKey(eventId),
        });
        await queryClient.invalidateQueries({
          queryKey: getEventDashboardDataByIdQueryKey(eventId),
        });

        toast.success('Pagamento cadastrado com sucesso');
      },
      onError: (error) => {
        // biome-ignore lint/suspicious/noConsole: here
        console.log(error);
        toast.error('Erro ao cadastrar pagamento', {
          description: error.response?.data?.error,
        });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof ticketPaymentCreateSchema>) {
    await createTicketPayment.mutateAsync({
      eventId,
      data: {
        amount: values.amount,
        type: values.type as 'CASH' | 'PIX',
        payedAt: values.payedAt.toISOString(),
        visionId: values.visionId,
        memberId,
      },
    });
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" color="blue" size="sm" variant="outline">
          Pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar pagamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            {/* <pre>
              {JSON.stringify(Object.keys(ticketPaymentSchema.shape), null, 2)}
            </pre> */}

            <FormField
              control={form.control}
              name="visionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Vision</FormLabel>
                  <FormControl>
                    <Input placeholder="ID Vision" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input placeholder="Valor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de pagamento</FormLabel>
                  <FormControl>
                    {/* <MySelect
                      placeholder="Selecione o tipo de pagamento"
                      {...field}
                      options={[
                        { label: 'Dinheiro', value: 'CASH' },
                        { label: 'PIX', value: 'PIX' },
                      ]}
                    /> */}
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pago em</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={field.disabled}
                          variant="outline"
                        >
                          {field.value ? (
                            format(field.value, 'PPP', {
                              locale: ptBR,
                            })
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        initialFocus
                        mode="single"
                        onSelect={field.onChange}
                        selected={field.value}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Cadastrar'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
