/** biome-ignore-all lint/suspicious/noConsole: show errors */
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { generateFormFieldsFromZodSchema } from '@/components/generate-form-fields-from-zod-schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import {
  getBroadcastListsQueryKey,
  useCreateBroadcastList,
  useUpdateBroadcastList,
} from '@/http/generated';
import type { List } from './columns';

const listCreateSchema = z
  .object({
    name: z.string().describe('Nome'),
    description: z.string().min(10).optional().describe('Descrição'),
    additionalParams: z
      .array(z.string())
      .describe('Parâmetros Adicionais'),
  })
  .describe('Lista de Transmissão');

const formName = listCreateSchema.description;

export function ListForm({ list }: { list?: List }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof listCreateSchema>>({
    resolver: zodResolver(listCreateSchema),
    defaultValues: list
      ? {
        // biome-ignore lint/suspicious/noExplicitAny: ignore
        ...(list as any),
      }
      : undefined,
  });

  // const values = {
  //   sessionId: {
  //     values: sessions?.map((session) => ({
  //       value: session.id,
  //       label: session.name,
  //     })),
  //     loading: isLoadingSessions,
  //   },
  // };
  // { append, remove, fields, insert, move, prepend, replace, swap, update }
  const additionalParams = useFieldArray({
    control: form.control,
    name: 'additionalParams' as never,
  })

  const createList = useCreateBroadcastList({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListsQueryKey(),
        });
        form.reset();
        setIsOpen(false);
        toast.success(`${formName} criado com sucesso`);
      },
      onError(error) {
        console.log(error);
        toast.error(`Erro ao criar o ${formName}`, {
          description: error.response?.data?.error || error.message,
        });
      },
    },
  });

  const updateList = useUpdateBroadcastList({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListsQueryKey(),
        });
        form.reset();
        setIsOpen(false);
        toast.success(`${formName} atualizado com sucesso`);
      },
      onError(error) {
        console.log(error);
        toast.error(`Erro ao atualizar o ${formName}`, {
          description: error.response?.data?.error || error.message,
        });
      },
    },
  });

  async function onSubmit(v: z.infer<typeof listCreateSchema>) {
    if (list) {
      await updateList.mutateAsync({
        listId: list.id,
        data: v,
        params: {
          listId: list.id,
        },
      });
    } else {
      await createList.mutateAsync({
        data: v,
      });
    }

    // console.log('values', v);
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{list ? <Edit /> : 'Adicionar'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {list ? 'Editar' : 'Cadastrar'} {formName}
          </DialogTitle>
          <DialogDescription>
            {' '}
            {list ? 'Editar' : 'Cadastrar'} {formName}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            {/* <pre>
            {JSON.stringify(list, null, 2)}
            {JSON.stringify(Object.keys(listCreateSchema.shape), null, 2)}
          </pre> */}

            {generateFormFieldsFromZodSchema(listCreateSchema, form, undefined, { additionalParams })}

            <Button className="w-full" type="submit">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : list ? (
                'Salvar'
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
