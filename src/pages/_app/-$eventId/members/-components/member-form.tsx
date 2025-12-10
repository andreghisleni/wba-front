import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
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
import { Form } from '@/components/ui/form';
import {
  getEventMembersQueryKey,
  useCreateEventMember,
  useGetAllScoutSessions,
  useUpdateEventMemberById,
} from '@/http/generated';
import type { Member } from './columns';

const memberCreateSchema = z
  .object({
    name: z.string().describe('Nome'),
    visionId: z.string().describe('Vision').optional(),
    register: z.string().describe('Registro').optional(),
    sessionId: z.string().uuid().describe('Seção'),
  })
  .describe('Membro');

const formName = memberCreateSchema.description;

export function MemberForm({ member }: { member?: Member }) {
  const eventId = useParams({
    strict: false,
  }).eventId as string;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof memberCreateSchema>>({
    resolver: zodResolver(memberCreateSchema),
    defaultValues: member
      ? {
          // biome-ignore lint/suspicious/noExplicitAny: ignore
          ...(member as any),
          sessionId: member.session.id,
        }
      : undefined,
  });

  const { data: sessions, isLoading: isLoadingSessions } =
    useGetAllScoutSessions();

  const values = {
    sessionId: {
      values: sessions?.map((session) => ({
        value: session.id,
        label: session.name,
      })),
      loading: isLoadingSessions,
    },
  };

  const createMember = useCreateEventMember({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getEventMembersQueryKey(eventId),
        });
        form.reset();
        setIsOpen(false);
        toast.success(`${formName} criado com sucesso`);
      },
      onError(error) {
        // biome-ignore lint/suspicious/noConsole: <explanation>
        console.log(error);
        toast.error(`Erro ao criar o ${formName}`, {
          description: error.message,
        });
      },
    },
  });

  const updateMember = useUpdateEventMemberById({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getEventMembersQueryKey(eventId),
        });
        form.reset();
        setIsOpen(false);
        toast.success(`${formName} atualizado com sucesso`);
      },
      onError(error) {
        // biome-ignore lint/suspicious/noConsole: <explanation>
        console.log(error);
        toast.error(`Erro ao atualizar o ${formName}`, {
          description: error.message,
        });
      },
    },
  });

  async function onSubmit(v: z.infer<typeof memberCreateSchema>) {
    if (member) {
      await updateMember.mutateAsync({
        eventId,
        id: member.id,
        data: v,
      });
    } else {
      await createMember.mutateAsync({
        eventId,
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
        <Button variant="outline">{member ? 'Editar' : 'Adicionar'}</Button>
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

            {generateFormFieldsFromZodSchema(memberCreateSchema, form, values)}

            <Button className="w-full" type="submit">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : member ? (
                'Editar'
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
