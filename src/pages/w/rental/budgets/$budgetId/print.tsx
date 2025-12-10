import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Printer } from "lucide-react";
import { useEffect } from "react";
import LogoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetBudgetById } from "@/http/generated";
import { formatToBRL } from "@/utils/formatToBRL";

export const Route = createFileRoute("/w/rental/budgets/$budgetId/print")({
  component: BudgetPrintPage,
});

function BudgetPrintPage() {
  const budgetId = Route.useParams().budgetId as string;
  const { data: budget, isLoading } = useGetBudgetById(budgetId);

  // Título da página para quando salvar em PDF
  useEffect(() => {
    if (budget) {
      document.title = `Proposta - ${budget.clientName}`;
    }
  }, [budget]);

  useEffect(() => {
    // Só entra aqui se o budget estiver preenchido
    if (budget) {
      const handleClose = () => window.close();

      window.addEventListener("afterprint", handleClose);

      // Pequeno timeout para garantir que o React renderizou o DOM com os dados novos
      setTimeout(() => {
        window.print();
      }, 100);

      return () => window.removeEventListener("afterprint", handleClose);
    }
  }, [budget]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!budget) {
    return <div>Orçamento não encontrado.</div>;
  }

  // --- CÁLCULOS ---
  // 1. Calcular totais por ambiente (Seção)
  const sectionsSummary =
    budget.sections?.map((section) => {
      const totalSection =
        section.items?.reduce(
          (acc, item) => acc + Number(item.subtotal || 0),
          0
        ) || 0;
      return {
        id: section.id,
        name: section.name,
        total: totalSection,
      };
    }) || [];

  const totalEquipments = Number(budget.totalValue);
  const labor = Number(budget.laborCost || 0);
  const transport = Number(budget.transportCost || 0);
  const discount = Number(budget.discount || 0);
  const finalValue = Number(budget.finalValue);

  return (
    <div className="min-h-screen bg-white p-8 text-black print:p-4">
      {/* BOTÃO DE IMPRIMIR (Some na impressão) */}
      <div className="mb-8 flex justify-end print:hidden">
        <Button onClick={() => window.print()} size="lg">
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      {/* --- FOLHA A4 --- */}
      <div className="mx-auto max-w-[210mm] space-y-8 print:w-full print:max-w-none">
        {/* 1. CABEÇALHO DA EMPRESA */}
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            {/* <h1 className="font-bold text-2xl uppercase tracking-wider">
              Gestão Som
            </h1>
            <p className="text-gray-500 text-sm">
              Soluções em Áudio e Iluminação
            </p> */}
            <picture>
              <source srcSet={LogoImg} type="image/png" />
              <img
                alt="Logo André Sonorização"
                className="h-34 rounded-2xl"
                src={LogoImg}
              />
            </picture>
            <p className="text-gray-500 text-sm">
              Som e luz para o seu evento.
            </p>
          </div>
          <div className="text-right text-gray-500 text-sm">
            {/* <p>CNPJ: 00.000.000/0001-00</p>
            <p>contato@gestaosom.com.br</p>
            <p>(00) 99999-9999</p> */}
          </div>
        </div>

        {/* 2. DADOS DO CLIENTE E EVENTO */}
        <div className="rounded-lg bg-gray-50 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-gray-400 text-xs uppercase">
                Cliente
              </p>
              <p className="font-medium text-lg">{budget.clientName}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-400 text-xs uppercase">
                Data do Evento
              </p>
              <p className="font-medium text-lg">
                {format(new Date(budget.eventDate), "d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
              <p className="text-gray-500 text-sm">
                às {format(new Date(budget.eventDate), "HH:mm")}
              </p>
            </div>
          </div>
        </div>

        {/* 3. RESUMO DOS AMBIENTES (Sem listar equipamentos) */}
        <div>
          <h2 className="mb-4 font-bold text-gray-800 text-xl">
            Escopo da Locação
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-gray-100 border-b-2 text-left text-gray-500 text-sm uppercase">
                <th className="pb-2">Ambiente / Serviço</th>
                <th className="pb-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sectionsSummary.map((section) => (
                <tr key={section.id}>
                  <td className="py-4 font-medium text-gray-700">
                    {section.name}
                  </td>
                  <td className="py-4 text-right font-medium text-gray-900">
                    {formatToBRL(section.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. TOTALIZADORES */}
        <div className="flex justify-end pt-4">
          <div className="w-1/2 space-y-3">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Subtotal Locação</span>
              <span>{formatToBRL(totalEquipments)}</span>
            </div>

            <div className="flex justify-between text-gray-500 text-sm">
              <span>Mão de Obra / Serviços</span>
              <span>+ {formatToBRL(labor)}</span>
            </div>

            <div className="flex justify-between text-gray-500 text-sm">
              <span>Logística / Frete</span>
              <span>+ {formatToBRL(transport)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between font-medium text-red-600 text-sm">
                <span>Desconto</span>
                <span>- {formatToBRL(discount)}</span>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex items-center justify-between rounded-lg bg-gray-900 p-4 text-white print:bg-gray-900 print:[print-color-adjust:exact]">
              <span className="font-bold text-lg">Total Final</span>
              <span className="font-bold text-2xl">
                {formatToBRL(finalValue)}
              </span>
            </div>
          </div>
        </div>

        {/* 5. RODAPÉ / ASSINATURAS */}
        {/* <div className="mt-20 grid grid-cols-2 gap-12 pt-12 text-center text-gray-400 text-sm">
          <div className="border-gray-300 border-t pt-4">
            <p className="font-medium text-gray-900">Gestão Som</p>
            <p>Contratada</p>
          </div>
          <div className="border-gray-300 border-t pt-4">
            <p className="font-medium text-gray-900">{budget.clientName}</p>
            <p>Contratante</p>
          </div>
        </div> */}

        <div className="mt-8 text-center text-gray-300 text-xs">
          <p>
            Proposta válida por 15 dias. Gerado em{" "}
            {format(new Date(), "dd/MM/yyyy")}.
          </p>
        </div>
      </div>
    </div>
  );
}
