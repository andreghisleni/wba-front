import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { generateFormFieldsFromZodSchema } from "@/components/generate-form-fields-from-zod-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useCloneBudget } from "@/http/generated"; // Certifique-se que o hook existe

const cloneSchema = z.object({
  clientName: z
    .string()
    .min(1, "Nome do cliente é obrigatório")
    .describe("Nome do cliente"),
  eventDate: z.coerce.date().describe("Data e hora do evento"),
});

interface CloneBudgetDialogProps {
  originalId: string;
  originalClientName: string;
}

export function CloneBudgetDialog({
  originalId,
  originalClientName,
}: CloneBudgetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof cloneSchema>>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      clientName: "", // Começa vazio ou com "Cópia de..." se preferir
      eventDate: undefined,
    },
  });

  const cloneBudget = useCloneBudget({
    mutation: {
      onSuccess: (data) => {
        toast.success("Orçamento clonado com sucesso!");
        setIsOpen(false);
        form.reset();

        // Redireciona para o novo orçamento
        navigate({
          to: "/rental/budgets/$budgetId",
          params: { budgetId: data.id },
        });
      },
      onError: (error) => {
        toast.error("Erro ao clonar", { description: error.message });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof cloneSchema>) {
    await cloneBudget.mutateAsync({
      budgetId: originalId,
      data: {
        clientName: values.clientName,
        eventDate: new Date(values.eventDate).toISOString(),
      },
    });
  }

  useEffect(() => {
    if (isOpen) {
      form.reset({
        clientName: `Cópia - ${originalClientName}`,
        eventDate: undefined,
      });
    }
  }, [isOpen, originalClientName, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button color="yellow" size="icon" title="Clonar Orçamento">
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clonar Orçamento</DialogTitle>
          <DialogDescription>
            Crie uma cópia de <b>{originalClientName}</b> definindo o novo
            cliente e data. Todos os itens e valores serão copiados.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(cloneSchema, form, {
              eventDate: { type: "datetime-local", loading: false },
            })}

            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Confirmar Clonagem"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
