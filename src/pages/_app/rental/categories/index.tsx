import { createFileRoute } from "@tanstack/react-router";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { Suspense } from "react";
import { DataTable } from "@/components/data-table";
import { FilterBase } from "@/components/filter-base";
import { Pagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useGetCategories } from "@/http/generated";
import { CategoryForm } from "./-components/category-form";
import { columns } from "./-components/columns";

export const Route = createFileRoute("/_app/rental/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [{ pageIndex, pageSize, filter, ...rest }] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(""),
    "ob.name": parseAsString.withDefault(""),
    "ob.rentalPercent": parseAsString.withDefault(""),
    "ob.createdAt": parseAsString.withDefault(""),
  });

  const { data, isLoading } = useGetCategories({
    "p.page": pageIndex,
    "p.pageSize": pageSize,
    "f.filter": filter || undefined,
    "ob.name": rest["ob.name"] || undefined,
    "ob.rentalPercent": rest["ob.rentalPercent"] || undefined,
    "ob.createdAt": rest["ob.createdAt"] || undefined,
  });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: data?.meta.total,
      showing: data?.data.length,
    });

  return (
    <div className="space-y-4 px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">Categorias</h2>
      <DataTable
        addComponent={<CategoryForm />}
        columns={columns}
        data={data?.data || []}
        filterComponent={<FilterBase />}
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
