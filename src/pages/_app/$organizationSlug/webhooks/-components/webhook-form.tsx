import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  getWebhooksQueryKey,
  useCreateWebhook,
  useUpdateWebhook,
} from '@/http/generated';

import {
  EVENT_OPTIONS,
  type Webhook,
  type WebhookSchema,
  webhookSchema,
} from './schema';

interface WebhookFormProps {
  webhookToEdit?: Webhook; // Se passado, entra em modo de edição
}

export function WebhookForm({
  webhookToEdit,
}: WebhookFormProps) {
  const [open, onOpenChange] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: createWebhook, isPending: isCreating } =
    useCreateWebhook({
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getWebhooksQueryKey(),
          });
          toast.success(
            `Webhook ${webhookToEdit ? 'atualizado' : 'criado'} com sucesso!`
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error?.message ||
            `Erro ao ${webhookToEdit ? 'atualizar' : 'criar'
            } webhook. Tente novamente mais tarde.`
          );
        },
      }
    });
  const { mutateAsync: updateWebhook, isPending: isUpdating } =
    useUpdateWebhook({
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getWebhooksQueryKey(),
          });
          toast.success(
            `Webhook ${webhookToEdit ? 'atualizado' : 'criado'} com sucesso!`
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error?.message ||
            `Erro ao ${webhookToEdit ? 'atualizar' : 'criar'
            } webhook. Tente novamente mais tarde.`
          );
        },
      }
    });

  const form = useForm<WebhookSchema>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      url: '',
      events: [],
      enabled: true,
    },
  });

  // Reseta o form quando abre/fecha ou muda o modo de edição
  useEffect(() => {
    if (open) {
      form.reset({
        name: webhookToEdit?.name || '',
        url: webhookToEdit?.url || '',
        events: webhookToEdit?.events || [],
        enabled: webhookToEdit?.enabled ?? true,
      });
    }
  }, [open, webhookToEdit, form]);

  async function onSubmit(data: WebhookSchema) {

    if (webhookToEdit) {
      await updateWebhook({ id: webhookToEdit.id, data });
    } else {
      await createWebhook({ data });
    }
  }

  const isPending = isCreating || isUpdating;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        {webhookToEdit ? (
          <Button variant="outline">Editar Webhook</Button>
        ) : (
          <Button>Novo Webhook</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {webhookToEdit ? 'Editar Webhook' : 'Novo Webhook'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Integração</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Typebot Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Destino (POST)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.seusistema.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Eventos (Checkboxes) */}
            <FormField
              control={form.control}
              name="events"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Eventos Inscritos
                    </FormLabel>
                    <FormDescription>
                      Selecione quando este webhook deve ser disparado.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {EVENT_OPTIONS.map((item) => (
                      <FormField
                        control={form.control}
                        key={item.value}
                        name="events"
                        render={({ field }) => {
                          return (
                            <FormItem
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"
                              key={item.value}
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                        ...field.value,
                                        item.value,
                                      ])
                                      : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.value
                                        )
                                      );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ativo/Inativo */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <FormDescription>
                      Habilitar disparos para este webhook.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
