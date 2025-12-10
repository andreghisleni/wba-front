import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
  useDeleteBudgetItemById,
  useUpdateBudgetItem,
} from "@/http/generated";

// --- EDIT ITEM DIALOG ---
const editItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Qtd mínima 1"),
  unitPrice: z.coerce.number().min(0, "Preço inválido"),
});

interface EditItemProps {
  itemId: string;
  itemData: { quantity: number; unitPrice: number; name: string };
}

export function EditItemDialog({ itemId, itemData }: EditItemProps) {
  const budgetId = useParams({ strict: false }).budgetId as string;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      quantity: itemData.quantity,
      unitPrice: Number(itemData.unitPrice),
    },
  });

  const updateItem = useUpdateBudgetItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(budgetId),
        });
        setIsOpen(false);
        toast.success("Item atualizado!");
      },
      onError: (err) =>
        toast.error("Erro ao atualizar", { description: err.message }),
    },
  });

  const onSubmit = (values: z.infer<typeof editItemSchema>) => {
    // A rota de update espera { budgetId, id, data: { ... } }
    // O budgetId na rota do item geralmente é usado para validação ou recalculada do pai
    updateItem.mutate({
      id: itemId,
      budgetId, // Passamos o budgetId pois nossa rota de backend pedia
      data: {
        quantity: values.quantity,
        customUnitPrice: values.unitPrice, // Backend espera customUnitPrice para sobrescrever
      },
    });
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        quantity: itemData.quantity,
        unitPrice: Number(itemData.unitPrice),
      });
    }
  }, [isOpen, itemData, form]);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          size="icon"
          variant="ghost"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Editar: {itemData.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(editItemSchema, form)}
            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- DELETE ITEM BUTTON ---
export function DeleteItemButton({ itemId }: { itemId: string }) {
  const budgetId = useParams({ strict: false }).budgetId as string;
  const queryClient = useQueryClient();

  const deleteItem = useDeleteBudgetItemById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(budgetId),
        });
        toast.success("Item removido");
      },
      onError: (err) => toast.error("Erro", { description: err.message }),
    },
  });

  return (
    <Button
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      disabled={deleteItem.isPending}
      onClick={() => deleteItem.mutate({ id: itemId, budgetId })}
      size="icon"
      variant="ghost" // Passando budgetId conforme rota
    >
      {deleteItem.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
