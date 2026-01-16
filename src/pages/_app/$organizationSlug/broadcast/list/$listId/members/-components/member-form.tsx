/** biome-ignore-all lint/suspicious/noConsole: show errors */
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Edit, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  getBroadcastListMembersQueryKey,
  useCreateBroadcastListMember,
  useGetContacts,
  useUpdateBroadcastListMember,
} from '@/http/generated';
import type { Member } from './columns';

const memberCreateSchema = z
  .object({
    contactId: z.string().describe('ID do Contato'),
  })
  .describe('Membro de uma lista de Transmissão');

const formName = memberCreateSchema.description;

export function MemberForm({
  member,
  additionalParams,
}: {
  member?: Member;
  additionalParams?: string[];
}) {
  const listId = useParams({
    strict: false,
  }).listId as string;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const memberCompleteSchema =
    additionalParams && additionalParams.length > 0
      ? memberCreateSchema.extend(
        Object.fromEntries(
          additionalParams.map((param) => [
            param,
            z.string().describe(`Parâmetro Adicional: ${param}`),
          ])
        )
      )
      : memberCreateSchema;
  const form = useForm<z.infer<typeof memberCompleteSchema>>({
    resolver: zodResolver(memberCompleteSchema),
    defaultValues: member
      ? {
        // biome-ignore lint/suspicious/noExplicitAny: ignore
        ...(member as any),
        contactId: member.contact.id,
        ...member.additionalParams,
      }
      : undefined,

    values: member
      ? {
        contactId: member.contact.id,
        ...member.additionalParams,
      }
      : undefined,
  });

  const { data: contacts, isLoading: isLoadingContacts } = useGetContacts();

  const values = {
    contactId: {
      values: contacts?.map((contact) => ({
        value: contact.id,
        label: contact.name || contact.phone,
      })),
      loading: isLoadingContacts,
    },
  };

  const createMember = useCreateBroadcastListMember({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListMembersQueryKey(listId),
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

  const updateMember = useUpdateBroadcastListMember({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListMembersQueryKey(listId),
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

  async function onSubmit({
    contactId,
    ...addParameters
  }: z.infer<typeof memberCompleteSchema>) {
    if (member) {
      await updateMember.mutateAsync({
        id: member.id,
        data: { additionalParams: addParameters },
        listId,
      });
    } else {
      await createMember.mutateAsync({
        data: { contactId, additionalParams: addParameters },
        listId,
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
        <Button variant="outline">{member ? <Edit /> : 'Adicionar'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {member ? 'Editar' : 'Cadastrar'} {formName}
          </DialogTitle>
          <DialogDescription>
            {' '}
            {member ? 'Editar' : 'Cadastrar'} {formName}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <pre>
              {/* {JSON.stringify(member, null, 2)} */}
              {/* {JSON.stringify(Object.keys(memberCreateSchema.shape), null, 2)} */}
            </pre>

            {generateFormFieldsFromZodSchema(memberCreateSchema, form as never, values)}

            {additionalParams &&
              additionalParams.length > 0 &&
              additionalParams.map((param) => (
                <FormField
                  control={form.control}
                  key={param}
                  name={param as never}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{param}</FormLabel>
                      <FormControl>
                        <Input placeholder="Event Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

            <Button className="w-full" type="submit">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : member ? (
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
