import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { auth } from '@/lib/auth';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres'),
});

export type OrganizationFormData = z.infer<typeof formSchema>;

export function OrganizationFormDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  async function onSubmit(data: OrganizationFormData) {
    try {
      const response = await auth.organization.create({
        name: data.name,
        slug: data.slug,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('Organização criada com sucesso!');
      setIsOpen(false);
      form.reset();
    } catch {
      toast.error('Erro ao criar organização');
    }
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start font-normal" variant="ghost">
          <PlusIcon aria-hidden="true" className="-ms-2 opacity-60" size={16} />
          Criar Organização
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar Organização</DialogTitle>
          <DialogDescription>
            Crie uma nova organização para gerenciar seus projetos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Minha Empresa"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const slug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        form.setValue('slug', slug);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="minha-empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Criar'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
