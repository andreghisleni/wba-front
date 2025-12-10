import { createFileRoute } from "@tanstack/react-router";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { Suspense } from "react";
import z from "zod";
import { DataTable } from "@/components/data-table";
import { FilterBase } from "@/components/filter-base";
import { Pagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useGetCategories, useGetEquipments } from "@/http/generated";
import { columns } from "./-components/columns";
import { EquipmentForm } from "./-components/equipment-form";

export const Route = createFileRoute("/_app/rental/equipment/")({
  component: EquipmentPage,
});

function EquipmentPage() {
  const [{ pageIndex, pageSize, filter, category, ...rest }] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(""),
    category: parseAsString.withDefault(""),
    "ob.name": parseAsString.withDefault(""),
    "ob.purchasePrice": parseAsString.withDefault(""),
    "ob.rentalPrice": parseAsString.withDefault(""),
    "ob.stockQuantity": parseAsString.withDefault(""),
    "ob.createdAt": parseAsString.withDefault(""),
    "ob.categoryName": parseAsString.withDefault(""),
  });

  const { data: categories } = useGetCategories({ "p.pageSize": 100 });

  const { data, isLoading } = useGetEquipments({
    "p.page": pageIndex,
    "p.pageSize": pageSize,
    "f.filter": filter || undefined,
    "f.categoryId": category || undefined, // Assumindo que o back suporta esse filtro
    "ob.name": rest["ob.name"] || undefined,
    "ob.purchasePrice": rest["ob.purchasePrice"] || undefined,
    "ob.rentalPrice": rest["ob.rentalPrice"] || undefined,
    "ob.stockQuantity": rest["ob.stockQuantity"] || undefined,
    "ob.createdAt": rest["ob.createdAt"] || undefined,
    "ob.categoryName": rest["ob.categoryName"] || undefined,
  });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: data?.meta.total,
      showing: data?.data.length,
    });

  return (
    <div className="space-y-4 px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">Inventário</h2>
      <DataTable
        addComponent={<EquipmentForm />}
        columns={columns}
        data={data?.data || []}
        filterComponent={
          <FilterBase
            additionalFieldsSchema={z.object({
              category: z.string().optional().describe("Categoria"),
            })}
            values={{
              category:
                categories?.data.map((c) => ({ label: c.name, value: c.id })) ||
                [],
            }}
          />
        }
        ifJustFilterComponent
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
