import { createFileRoute } from "@tanstack/react-router";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useGetBudgets } from "@/http/generated";
import { columns } from "./-components/columns";
import { CreateBudgetDialog } from "./-components/create-budget-dialog";

export const Route = createFileRoute("/_app/rental/budgets/")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const [{ pageIndex, pageSize, filter, ...rest }] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(""),
    "ob.clientName": parseAsString.withDefault(""),
    "ob.eventDate": parseAsString.withDefault(""),
    "ob.status": parseAsString.withDefault(""),
    "ob.finalValue": parseAsString.withDefault(""),
    "ob.createdAt": parseAsString.withDefault("desc"),
  });

  const { data, isLoading } = useGetBudgets({
    "p.page": pageIndex,
    "p.pageSize": pageSize,
    "f.filter": filter || undefined,
    "ob.clientName": rest["ob.clientName"] || undefined,
    "ob.eventDate": rest["ob.eventDate"] || undefined,
    "ob.status": rest["ob.status"] || undefined,
    "ob.finalValue": rest["ob.finalValue"] || undefined,
    "ob.createdAt": rest["ob.createdAt"] || undefined,
  });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: data?.meta.total,
      showing: data?.data.length,
    });

  return (
    <div className="space-y-4 px-8 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-3xl tracking-tight">Orçamentos</h2>
      </div>

      <DataTable
        addComponent={<CreateBudgetDialog />}
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        paginationComponent={
          <Suspense fallback={null}>
            <Pagination
              handleChangeLimit={setPageSize}
              handleUpdatePage={navigateToPage}
              items={total}
              limit={pageSize}
              page={pageIndex}
              pages={totalPages}
              showing={showing}
            />
          </Suspense>
        }
      />
    </div>
  );
}
