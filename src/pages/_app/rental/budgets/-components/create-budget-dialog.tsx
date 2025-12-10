import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import {
  getBudgetByIdQueryKey,
  getBudgetsQueryKey,
  useCreateBudget,
  useUpdateBudget,
} from "@/http/generated";
import type { Budget } from "./columns";

const createBudgetSchema = z.object({
  clientName: z
    .string()
    .min(1, "Nome do cliente é obrigatório")
    .describe("Nome do Cliente"),
  eventDate: z
    .date()
    // .min(1, "Data do evento é obrigatória")
    .describe("Data do Evento"),
  // O backend espera ISO String, mas o input type="datetime-local" ajuda a formatar
});

export function CreateBudgetDialog({ budget }: { budget?: Budget }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof createBudgetSchema>>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      clientName: "",
      eventDate: undefined,
    },
    values: budget
      ? {
          clientName: budget.clientName,
          eventDate: new Date(budget.eventDate),
        }
      : undefined,
  });

  const createBudget = useCreateBudget({
    mutation: {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: getBudgetsQueryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(data.id),
        });
        toast.success("Rascunho criado com sucesso!");
        setIsOpen(false);
        form.reset();

        // REDIRECIONAMENTO IMEDIATO
        // O backend retorna { id: string }
        navigate({
          to: "/rental/budgets/$budgetId",
          params: { budgetId: data.id },
        });
      },
      onError: (error) => {
        toast.error("Erro ao iniciar orçamento", {
          description: error.response.data.error,
        });
      },
    },
  });

  const updateBudget = useUpdateBudget({
    mutation: {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: getBudgetsQueryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(data.id),
        });
        toast.success("Orçamento atualizado com sucesso");
        setIsOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast.error("Erro ao atualizar orçamento", {
          description: error.response.data.error,
        });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof createBudgetSchema>) {
    // Garante formato ISO 8601 para o backend
    const payload = {
      ...values,
      eventDate: new Date(values.eventDate).toISOString(),
      sections: [], // Começa sem seções
    };
    if (budget) {
      await updateBudget.mutateAsync({
        budgetId: budget.id,
        data: {
          ...values,
          eventDate: new Date(values.eventDate).toISOString(),
        },
      });
    } else {
      await createBudget.mutateAsync({ data: payload });
    }
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      {budget ? (
        <DialogTrigger asChild>
          <Button color="blue" size="icon" variant="outline">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Orçamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(createBudgetSchema, form, {
              eventDate: { type: "datetime-local", loading: false },
            })}

            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : budget ? (
                "Salvar e atualizar"
              ) : (
                "Criar e Continuar"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
