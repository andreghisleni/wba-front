'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
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
import {
  Form
} from '@/components/ui/form';
import {
  getTagByIdQueryKey,
  getTagsQueryKey,
  useCreateTag
} from '@/http/generated';
import type { Tag } from './columns';

export const formSchema = z.object({
  name: z.string().min(1, 'O nome da tag é obrigatório').describe('Nome da tag'),
});

export function TagKanbanForm({ tag }: { tag?: Tag }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const createTag = useCreateTag({
    mutation: {
      onSuccess: async (data) => {
        form.reset();
        setIsOpen(false);
        toast.success('Tag cadastrada com sucesso');

        await queryClient.invalidateQueries({
          queryKey: getTagsQueryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: getTagByIdQueryKey(data.id),
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
      name: tag?.name || '',
      // ...tag,
    },
    values: {
      name: tag?.name || '',
      // ...tag,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // biome-ignore lint/suspicious/noConsole: hi
    console.log(values);
    try {
      await createTag.mutateAsync({
        data: {
          name: values.name,
          priority: 0,
          colorName: '',
          type: 'kanban',
        },
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
      <DialogTrigger asChild>
        <Button variant="outline">{tag ? 'Editar' : 'Adicionar kanban'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tag ? 'Editar' : 'Cadastrar'} kanban
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(formSchema, form)}

            <Button className="w-full" type="submit">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : tag?.id ? (
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
