import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  useCreateBudgetItem,
  useGetEquipments,
} from "@/http/generated";
import { formatToBRL } from "@/utils/formatToBRL";

const itemSchema = z.object({
  equipmentId: z.string().uuid().describe("Equipamento"),
  quantity: z.coerce.number().int().min(1).describe("Quantidade"),
  customUnitPrice: z.coerce
    .number()
    .min(0)
    .optional()
    .describe("Preço Unitário (R$)"),
});

interface CreateItemDialogProps {
  sectionId: string;
  sectionName: string;
}

export function CreateItemDialog({
  sectionId,
  sectionName,
}: CreateItemDialogProps) {
  const budgetId = useParams({ strict: false }).budgetId as string;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // 1. Buscar Equipamentos para o Select
  const { data: equipmentsData, isLoading: isLoadingEq } = useGetEquipments({
    "p.pageSize": 1000, // Traz tudo para facilitar
    "ob.name": "asc",
  });
  const equipments = equipmentsData?.data || [];

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  // 2. Auto-preencher preço ao selecionar equipamento
  const selectedEquipmentId = useWatch({
    control: form.control,
    name: "equipmentId",
  });

  useEffect(() => {
    if (selectedEquipmentId) {
      const eq = equipments.find((e) => e.id === selectedEquipmentId);
      if (eq) {
        // Prioriza o rentalPrice, senão calcula algo ou usa 0
        const price = eq.rentalPrice ?? 0;
        form.setValue("customUnitPrice", price);
      }
    }
  }, [selectedEquipmentId, equipments, form]);

  const createItem = useCreateBudgetItem({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(budgetId),
        });

        await queryClient.invalidateQueries({
          queryKey: getBudgetsQueryKey(),
        });
        form.reset();
        setIsOpen(false);
        toast.success("Item adicionado!");
      },
      onError(error) {
        toast.error("Erro ao adicionar item", {
          description: error.response.data.error,
        });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof itemSchema>) {
    await createItem.mutateAsync({
      sectionId,
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
        <Button className="h-8" size="sm" variant="ghost">
          <Plus className="mr-1 h-3 w-3" /> Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Item em: {sectionName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(itemSchema, form, {
              equipmentId: {
                values: equipments.map((eq) => ({
                  value: eq.id,
                  label: `${eq.name} (${formatToBRL(eq.rentalPrice || 0)})`,
                })),
                loading: isLoadingEq,
              },
            })}

            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Salvar Item"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
