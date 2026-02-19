'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { generateFormFieldsFromZodSchema } from '@/components/generate-form-fields-from-zod-schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import {
  getWhatsappContactsQueryKey,
  useAddTagToContact,
  useGetTags,
} from '@/http/generated';

export const formSchema = z.object({
  tagId: z.string().min(1, 'Selecione uma tag').describe('Tag do cliente'),
});

export function ContactTagForm({
  tagId,
  clientId,
  isOpen,
  setIsOpen,
}: {
  tagId?: string;
  clientId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetTags({
    'p.page': 1,
    'p.pageSize': 100,
  });

  const addTagToContact = useAddTagToContact({
    mutation: {
      onSuccess: async () => {
        form.reset();
        setIsOpen(false);
        if (tagId) {
          toast.success('Tag atualizada com sucesso');
        } else {
          toast.success('Tag adicionada com sucesso');
        }

        await queryClient.invalidateQueries({
          queryKey: getWhatsappContactsQueryKey(),
        });
      },
      onError: (error) => {
        toast.error('Erro ao cadastrar tag', {
          description: error.message,
        });
      },
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tagId: tagId || '',
    },
    values: {
      tagId: tagId || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // biome-ignore lint/suspicious/noConsole: hi
    console.log(values);
    try {
      await addTagToContact.mutateAsync({
        data: {
          tagId: values.tagId,
        },
        id: clientId,
      });
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: hi
      console.log(error);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tagId ? 'Editar' : 'Cadastrar'} tipo de inspeção
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(formSchema, form, {
              tagId: {
                loading: isLoading,
                values:
                  data?.data.map((tag) => ({
                    label: tag.name,
                    value: tag.id,
                  })) || [],
              },
            })}

            <Button className="w-full" type="submit">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : tagId ? (
                'Atualizar'
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
