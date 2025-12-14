import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  getDashboardApiKeysQueryKey,
  useCreateDashboardApiKey,
} from '@/http/generated';

import { type CreateApiKeySchema, createApiKeySchema } from './schema';

interface CreateKeyDialogProps {
  onKeyCreated: (fullKey: string) => void;
}

export function CreateKeyDialog({ onKeyCreated }: CreateKeyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Hook do Kubb para mutação
  const { mutateAsync: createKey, isPending } = useCreateDashboardApiKey({
    mutation: {
      onError: (error) => {
        toast.error(
          error?.message || 'Erro ao criar chave de API. Tente novamente mais tarde.'
        );
      },
      onSuccess: async (data) => {
        // Invalida a query para atualizar a lista automaticamente
        await queryClient.invalidateQueries({
          queryKey: getDashboardApiKeysQueryKey(), // Chave gerada pelo Kubb
        });

        // 2. Passa a chave para o pai exibir o modal de sucesso
        onKeyCreated(data.key);
        toast.success('Chave criada com sucesso!');
        setIsOpen(false);
        form.reset();
      },
    }
  });

  const form = useForm<CreateApiKeySchema>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(data: CreateApiKeySchema) {
    await createKey({ data: { name: data.name } });
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Chave
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Chave de API</DialogTitle>
          <DialogDescription>
            Crie um token para integrar sistemas externos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Integração</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: N8N Produção" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Chave
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
