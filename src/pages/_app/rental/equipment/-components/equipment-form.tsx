import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  getEquipmentsQueryKey,
  useCreateEquipment,
  useGetCategories,
  useUpdateEquipment,
} from "@/http/generated";
import { formatToBRL } from "@/utils/formatToBRL";
import type { Equipment } from "./columns";

const equipmentSchema = z.object({
  name: z.string().describe("Nome do Equipamento"),
  categoryId: z.string().uuid().describe("Categoria"),
  purchasePrice: z.coerce.number().min(0).describe("Preço de Compra (R$)"),
  stockQuantity: z.coerce
    .number()
    .int()
    .min(1)
    .describe("Quantidade em Estoque"),
});

export function EquipmentForm({ data }: { data?: Equipment }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategories({ "p.pageSize": 100 });
  const categories = categoriesData?.data || [];

  const form = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: data
      ? { ...data, categoryId: data.category.id }
      : { name: "", categoryId: "", purchasePrice: 0, stockQuantity: 1 },
  });

  // --- CÁLCULO VISUAL ---
  const watchPrice = useWatch({ control: form.control, name: "purchasePrice" });
  const watchCatId = useWatch({ control: form.control, name: "categoryId" });

  const rentalPricePreview = useMemo(() => {
    if (!(watchPrice && watchCatId)) {
      return 0;
    }
    const cat = categories.find((c) => c.id === watchCatId);
    return cat ? (watchPrice * cat.rentalPercent) / 100 : 0;
  }, [watchPrice, watchCatId, categories]);
  // ----------------------

  const createEquipment = useCreateEquipment({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getEquipmentsQueryKey(),
        });
        form.reset();
        setIsOpen(false);
        toast.success("Equipamento criado!");
      },
      onError(error) {
        toast.error("Erro ao cadastrar equipamento", {
          description: error.response.data.error,
        });
      },
    },
  });

  const updateEquipment = useUpdateEquipment({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getEquipmentsQueryKey(),
        });
        setIsOpen(false);
        toast.success("Equipamento atualizado!");
      },
      onError(error) {
        toast.error("Erro ao atualizar equipamento", {
          description: error.response.data.error,
        });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof equipmentSchema>) {
    if (data) {
      await updateEquipment.mutateAsync({ id: data.id, data: values });
    } else {
      await createEquipment.mutateAsync({ data: values });
    }
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const categoryWatch = useWatch({
    control: form.control,
    name: "categoryId",
  });

  const selectedCategory = categoriesData?.data.find(
    ({ id }) => id === categoryWatch
  );

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        {data ? (
          <Button size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data ? "Editar" : "Novo"} Equipamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(equipmentSchema, form, {
              categoryId: {
                values: categories.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.rentalPercent}%)`,
                })),
                loading: categoriesLoading,
              },
            })}

            {/* Preview do Preço */}
            <div className="flex items-center justify-between rounded-md bg-muted p-3 text-sm">
              <span>Valor de Locação Sugerido:</span>
              <span className="font-bold text-green-600 text-lg">
                {formatToBRL(rentalPricePreview)}
              </span>
            </div>

            {selectedCategory && (
              <div className="flex items-center justify-between gap-4 rounded-md bg-muted p-3 text-sm">
                <span className="whitespace-nowrap">
                  {selectedCategory?.name} ({selectedCategory.rentalPercent}%):
                </span>
                <span className="font-bold text-green-600">
                  {selectedCategory.description}
                </span>
              </div>
            )}

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
