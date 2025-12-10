import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { generateFormFieldsFromZodSchema } from "@/components/generate-form-fields-from-zod-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
// Ajuste os imports dos hooks conforme gerado pelo seu Kubb
import {
  getCategoriesQueryKey,
  useCreateCategory,
  useUpdateCategory,
} from "@/http/generated";
import type { Category } from "./columns";

const categorySchema = z
  .object({
    name: z.string().describe("Nome"),
    rentalPercent: z.coerce
      .number()
      .min(0)
      .max(100)
      .describe("Porcentagem de Locação (%)"),
  })
  .describe("Categoria");

const formName = "Categoria";

export function CategoryForm({ data }: { data?: Category }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: data
      ? { name: data.name, rentalPercent: data.rentalPercent }
      : { name: "", rentalPercent: 4 },
    values: data
      ? { name: data.name, rentalPercent: data.rentalPercent }
      : { name: "", rentalPercent: 4 },
  });

  const createCategory = useCreateCategory({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getCategoriesQueryKey(),
        });
        form.reset();
        setIsOpen(false);
        toast.success(`${formName} criada com sucesso`);
      },
      onError(error) {
        toast.error(`Erro ao criar ${formName}`, {
          description: error.response.data.error,
        });
      },
    },
  });

  const updateCategory = useUpdateCategory({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getCategoriesQueryKey(),
        });
        form.reset();
        setIsOpen(false);
        toast.success(`${formName} atualizada com sucesso`);
      },
      onError(error) {
        toast.error(`Erro ao atualizar ${formName}`, {
          description: error.response.data.error,
        });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    if (data) {
      await updateCategory.mutateAsync({ id: data.id, data: values });
    } else {
      await createCategory.mutateAsync({ data: values });
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
        {data ? (
          <Button size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nova Categoria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {data ? "Editar" : "Cadastrar"} {formName}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(categorySchema, form)}
            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
