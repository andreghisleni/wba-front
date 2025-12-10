import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  getAllEventsQueryKey,
  getEventByIdQueryKey,
  useGetEventById,
  useUpdateEventById,
} from '@/http/generated';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ticketType: z.enum(['SINGLE_NUMERATION', 'MULTIPLE_NUMERATIONS']),
  // não editamos ticketRanges aqui
  autoGenerateTicketsTotalPerMember: z.coerce.number().int().min(0).optional(),
  readOnly: z.boolean().optional(),
});

type EventEditForm = z.infer<typeof formSchema>;

export const Route = createFileRoute('/_app/$eventId/event/edit')({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const eventId = params.eventId;
  const queryClient = useQueryClient();

  const { data: eventData, isLoading: isLoadingEvent } =
    useGetEventById(eventId);
  const { mutateAsync } = useUpdateEventById({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getEventByIdQueryKey(eventId),
        });
        await queryClient.invalidateQueries({
          queryKey: getAllEventsQueryKey(),
        });

        toast.success('Evento atualizado com sucesso');
      },
      onError: (error) => {
        toast.error('Erro ao atualizar evento', {
          description: error.response?.data?.message,
        });
      },
    },
  });

  const form = useForm<EventEditForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      ticketType: 'SINGLE_NUMERATION',
      autoGenerateTicketsTotalPerMember: undefined,
      readOnly: false,
    },
  });

  // popula o form quando carregar o evento
  useEffect(() => {
    if (eventData) {
      form.reset({
        name: eventData.name ?? '',
        description: eventData.description ?? '',
        ticketType:
          (eventData.ticketType as
            | 'SINGLE_NUMERATION'
            | 'MULTIPLE_NUMERATIONS') ?? 'SINGLE_NUMERATION',
        autoGenerateTicketsTotalPerMember:
          eventData.autoGenerateTicketsTotalPerMember ?? undefined,
        readOnly: eventData.readOnly ?? false,
      });
    }
  }, [eventData, form.reset]);

  async function onSubmit(values: EventEditForm) {
    await mutateAsync({
      id: eventId,
      data: {
        name: values.name,
        description: values.description ?? null,
        autoGenerateTicketsTotalPerMember:
          values.autoGenerateTicketsTotalPerMember ?? undefined,
        readOnly: values.readOnly ?? undefined,
      },
    });
  }

  return (
    <div className="flex justify-center">
      <div className='w-110 px-8 pt-8 '>
        <h2 className="font-bold text-3xl tracking-tight">Editar Evento</h2>

        <div className="mt-6 max-w-2xl">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do evento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição do evento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ticketType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Numeração</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE_NUMERATION">
                            Numeração Única
                          </SelectItem>
                          <SelectItem value="MULTIPLE_NUMERATIONS">
                            Múltiplas Numerações
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoGenerateTicketsTotalPerMember"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto Generate Total per Member</FormLabel>
                    <FormControl>
                      <Input
                        min={0}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') {
                            field.onChange(undefined);
                          } else {
                            field.onChange(Number(v));
                          }
                        }}
                        placeholder="Ex: 2"
                        type="number"
                        value={
                          field.value === undefined || field.value === null
                            ? ''
                            : String(field.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="readOnly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel className="m-0">Read Only</FormLabel>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4">
                <h3 className="mb-2 font-medium">
                  Intervalos de Numeração (somente leitura)
                </h3>

                {isLoadingEvent ? (
                  <div>Carregando intervalos...</div>
                ) : (
                  (eventData?.ticketRanges ?? []).map((r) => (
                    <Card className="mb-3" key={r.id}>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Tipo
                            </div>
                            <div className="font-medium">{r.type}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Faixa
                            </div>
                            <div className="font-medium">
                              {r.start} — {r.end}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => window.history.back()}
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button disabled={form.formState.isSubmitting} type="submit">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
