import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Loader2, Printer, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  getBudgetByIdQueryKey,
  getBudgetsQueryKey,
  useGetBudgetById,
  useUpdateBudget,
} from "@/http/generated";
import { formatToBRL } from "@/utils/formatToBRL";
import { CreateItemDialog } from "./-components/create-item-dialog";
import { CreateSectionDialog } from "./-components/create-section-dialog";
import { DeleteItemButton, EditItemDialog } from "./-components/item-actions";
import {
  DeleteSectionDialog,
  EditSectionDialog,
} from "./-components/section-actions";

export const Route = createFileRoute("/_app/rental/budgets/$budgetId/")({
  component: BudgetDetailsPage,
});

// Status Colors
const statusMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CONFIRMED: "default",
};

// Schema apenas para os campos editáveis desta tela (Totais)
const updateBudgetSchema = z.object({
  laborCost: z.coerce.number().min(0).optional(),
  transportCost: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),

  // Auxiliares para calculadora (não enviados ao back)
  distanceKm: z.coerce.number().optional(),
  pricePerKm: z.coerce.number().optional(),
});

function BudgetDetailsPage() {
  const { budgetId } = Route.useParams();
  const queryClient = useQueryClient();

  // 1. Busca Dados do Orçamento
  const { data: budget, isLoading } = useGetBudgetById(budgetId);

  // 2. Setup do Formulário de Totais
  const form = useForm<z.infer<typeof updateBudgetSchema>>({
    resolver: zodResolver(updateBudgetSchema),
    defaultValues: {
      laborCost: 0,
      transportCost: 0,
      discount: 0,
    },
  });

  // Atualiza o form quando os dados do back chegam
  useEffect(() => {
    if (budget) {
      form.reset({
        laborCost: budget.laborCost || 0,
        transportCost: budget.transportCost || 0,
        discount: budget.discount || 0,
      });
    }
  }, [budget, form]);

  // 3. Hook de Atualização
  const updateBudget = useUpdateBudget({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getBudgetByIdQueryKey(budgetId),
        });
        await queryClient.invalidateQueries({
          queryKey: getBudgetsQueryKey(),
        });
        toast.success("Valores atualizados com sucesso!");
      },
      onError: (err) =>
        toast.error("Erro ao salvar", { description: err.message }),
    },
  });

  const onSubmit = (values: z.infer<typeof updateBudgetSchema>) => {
    // Remove os campos auxiliares antes de enviar
    const {
      distanceKm: _distanceKm,
      pricePerKm: _pricePerKm,
      ...dataToSend
    } = values;
    updateBudget.mutateAsync({ budgetId, data: dataToSend });
  };

  // 4. Cálculos em Tempo Real (Frontend)
  const watched = useWatch({ control: form.control });

  // Calculadora de Frete
  useEffect(() => {
    if (watched.distanceKm && watched.pricePerKm) {
      form.setValue("transportCost", watched.distanceKm * watched.pricePerKm);
    }
  }, [watched.distanceKm, watched.pricePerKm, form]);

  // Total Final Previsto
  const currentTotalItems = Number(budget?.totalValue || 0);

  const labor = Number(watched.laborCost || 0);
  const transport = Number(watched.transportCost || 0);
  const discount = Number(watched.discount || 0);

  const finalTotalPreview = currentTotalItems + labor + transport - discount;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!budget) {
    return <div className="p-8">Orçamento não encontrado.</div>;
  }
  return (
    <div className="space-y-6 p-8 pb-20">
      {/* CABEÇALHO */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            {budget.clientName}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <span>
              {format(new Date(budget.eventDate), "dd/MM/yyyy 'às' HH:mm")}
            </span>
            <Badge variant={statusMap[budget.status] || "outline"}>
              {budget.status}
            </Badge>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link
            params={{ budgetId }}
            target="_blank"
            to="/w/rental/budgets/$budgetId/print"
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Link>
        </Button>
      </div>
      {/* CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Total Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatToBRL(currentTotalItems)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Mão de Obra / Frete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-blue-600">
              +{formatToBRL(labor + transport)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Descontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-red-500">
              -{formatToBRL(discount)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-primary text-sm">
              Valor Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-primary">
              {formatToBRL(finalTotalPreview)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* COLUNA ESQUERDA: AMBIENTES E ITENS (2/3 da tela) */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xl">Ambientes</h2>
            <CreateSectionDialog />
          </div>

          {budget.sections?.length === 0 && (
            <div className="rounded-lg border border-dashed bg-muted/10 py-12 text-center text-muted-foreground">
              Nenhum ambiente cadastrado.
            </div>
          )}

          {budget.sections?.map((section) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-semibold text-base">
                    {section.name}
                  </CardTitle>

                  {/* BOTÕES DE AÇÃO DA SEÇÃO */}
                  <div className="flex items-center">
                    <EditSectionDialog
                      currentName={section.name}
                      sectionId={section.id}
                    />
                    <DeleteSectionDialog
                      disabled={section.items.length !== 0}
                      sectionId={section.id}
                    />
                  </div>
                </div>

                <CreateItemDialog
                  sectionId={section.id}
                  sectionName={section.name}
                />
              </CardHeader>
              <CardContent className="p-0">
                {!section.items || section.items.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Vazio
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/10 text-left text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Equipamento</th>
                        <th className="w-16 px-4 py-2 text-center font-medium">
                          Qtd
                        </th>
                        <th className="w-24 px-4 py-2 text-right font-medium">
                          Unit.
                        </th>
                        <th className="w-24 px-4 py-2 text-right font-medium">
                          Total
                        </th>
                        <th className="w-20 px-4 py-2 text-right font-medium">
                          Ações
                        </th>{" "}
                        {/* Nova Coluna */}
                      </tr>
                    </thead>
                    <tbody>
                      {section.items?.map((item) => (
                        <tr
                          className="group border-b last:border-0 hover:bg-muted/5" // group para hover
                          key={item.id}
                        >
                          <td className="px-4 py-2">
                            <div className="font-medium">
                              {item.equipment?.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase">
                              {item.equipment?.category?.name}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right text-muted-foreground">
                            {formatToBRL(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatToBRL(item.subtotal)}
                          </td>

                          {/* BOTÕES DE AÇÃO DO ITEM */}
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                              <EditItemDialog
                                itemData={{
                                  name: item.equipment?.name || "Item",
                                  quantity: item.quantity,
                                  unitPrice: item.unitPrice,
                                }}
                                itemId={item.id}
                              />
                              <DeleteItemButton itemId={item.id} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* COLUNA DIREITA: RESUMO EDITÁVEL (1/3 da tela) */}
        <div>
          <Card className="sticky top-4 border-2 shadow-sm">
            <CardHeader className="bg-muted/40 pb-3">
              <CardTitle>Fechamento</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {/* Total Itens (Read Only) */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Itens:</span>
                    <span className="font-medium">
                      {formatToBRL(currentTotalItems)}
                    </span>
                  </div>

                  <Separator />

                  {/* Mão de Obra */}
                  <FormField
                    control={form.control}
                    name="laborCost"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel className="font-bold text-muted-foreground text-xs">
                            MÃO DE OBRA
                          </FormLabel>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute top-2 left-2 text-muted-foreground text-xs">
                              R$
                            </span>
                            <Input
                              className="pl-8 text-right"
                              type="number"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Frete + Calculadora */}
                  <div className="rounded border bg-muted/30 p-2">
                    <FormField
                      control={form.control}
                      name="transportCost"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel className="font-bold text-muted-foreground text-xs">
                              FRETE
                            </FormLabel>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute top-2 left-2 text-muted-foreground text-xs">
                                R$
                              </span>
                              <Input
                                className="pl-8 text-right"
                                type="number"
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:underline">
                        Calcular rota
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="distanceKm"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="h-7 text-xs"
                                  placeholder="Km"
                                  type="number"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pricePerKm"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="h-7 text-xs"
                                  placeholder="R$/Km"
                                  type="number"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </details>
                  </div>

                  {/* Desconto */}
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel className="font-bold text-red-500 text-xs">
                            DESCONTO
                          </FormLabel>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute top-2 left-2 text-red-500 text-xs">
                              - R$
                            </span>
                            <Input
                              className="border-red-200 pl-10 text-right text-red-600"
                              type="number"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Total Final */}
                  <div className="rounded border border-primary/20 bg-primary/5 p-4 text-right">
                    <div className="font-bold text-primary text-xs uppercase">
                      Valor Final
                    </div>
                    <div className="font-bold text-3xl text-primary tracking-tighter">
                      {formatToBRL(finalTotalPreview)}
                    </div>
                  </div>

                  <Button
                    className="h-12 w-full text-lg"
                    disabled={form.formState.isSubmitting}
                    type="submit"
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" /> Atualizar Valores
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
