import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
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
import {
  getBudgetByIdQueryKey,
  useCreateBudgetSection,
} from "@/http/generated";

const sectionSchema = z.object({
  name: z.string().min(1).describe("Nome do Ambiente"),
});

export function CreateSectionDialog() {
  const budgetId = useParams({ strict: false }).budgetId as string;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: "" },
  });

  const createSection = useCreateBudgetSection({
    mutation: {
      async onSuccess() {
        // Atualiza a tela do orçamento para mostrar o novo ambiente
        await queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(budgetId),
        });
        form.reset();
        setIsOpen(false);
        toast.success("Ambiente adicionado!");
      },
      onError(error) {
        toast.error("Erro ao adicionar ambiente", {
          description: error.response.data.error,
        });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof sectionSchema>) {
    if (!budgetId) {
      return;
    }
    await createSection.mutateAsync({
      budgetId,
      data: values,
    });
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Ambiente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Ambiente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(sectionSchema, form)}

            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Adicionar"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
