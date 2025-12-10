import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { generateFormFieldsFromZodSchema } from "@/components/generate-form-fields-from-zod-schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  useDeleteBudgetSectionById,
  useUpdateBudgetSection,
} from "@/http/generated";

// Importe seus hooks gerados (ajuste os nomes conforme seu generated/index.ts)

// --- EDIT SECTION DIALOG ---
const editSectionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

export function EditSectionDialog({
  sectionId,
  currentName,
}: {
  sectionId: string;
  currentName: string;
}) {
  const budgetId = useParams({ strict: false }).budgetId as string;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(editSectionSchema),
    defaultValues: { name: currentName },
  });

  const updateSection = useUpdateBudgetSection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(budgetId),
        });
        setIsOpen(false);
        toast.success("Ambiente atualizado!");
      },
      onError: (err) =>
        toast.error("Erro ao atualizar", { description: err.message }),
    },
  });

  const onSubmit = (values: z.infer<typeof editSectionSchema>) => {
    updateSection.mutate({ budgetId, id: sectionId, data: values });
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({ name: currentName });
    }
  }, [isOpen, currentName, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          size="icon"
          variant="ghost"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear Ambiente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(editSectionSchema, form)}
            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
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

// --- DELETE SECTION ALERT ---
export function DeleteSectionDialog({
  sectionId,
  disabled,
}: {
  sectionId: string;
  disabled?: boolean;
}) {
  const budgetId = useParams({ strict: false }).budgetId as string;
  const queryClient = useQueryClient();

  const deleteSection = useDeleteBudgetSectionById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(budgetId),
        });
        toast.success("Ambiente removido!");
      },
      onError: (err) =>
        toast.error("Erro ao remover", { description: err.message }),
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          disabled={disabled}
          size="icon"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Ambiente?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso excluirá o ambiente e <b>todos os itens</b> dentro dele. Essa
            ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => deleteSection.mutate({ id: sectionId, budgetId })}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
