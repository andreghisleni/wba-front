import { createFileRoute } from '@tanstack/react-router';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Suspense } from 'react';
import z from 'zod';
import { DataTable } from '@/components/data-table';
import { FilterBase } from '@/components/filter-base';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useGetTags } from '@/http/generated';
import { columns } from './-components/columns';
import { TagForm } from './-components/tag-form';

export const Route = createFileRoute('/_app/$organizationSlug/tags/')({
  component: RouteComponent,
  params: z.object({
    organizationSlug: z.string(),
  }),
});

function RouteComponent() {
  const [{ pageIndex, pageSize, filter, ...rest }] = useQueryStates({
    // pageIndex é um inteiro, com valor padrão 1
    pageIndex: parseAsInteger.withDefault(1),
    // pageSize é uma string, com valor padrão '10' (pode ser parseAsInteger se preferir)
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(''), // Exemplo de filtro adicional
    'ob.name': parseAsString.withDefault(''), // Exemplo de ordenação
    'ob.priority': parseAsString.withDefault(''),
    'ob.createdAt': parseAsString.withDefault(''),
  });
  const { data, isLoading } = useGetTags({
    'p.page': pageIndex,
    'p.pageSize': pageSize,
    'f.filter': filter.length > 0 ? filter : undefined,
    'ob.name': rest['ob.name'] || undefined,
    'ob.priority': rest['ob.priority'] || undefined,
    'ob.createdAt': rest['ob.createdAt'] || undefined,
  });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: data?.meta.total,
      showing: data?.data.length,
    });

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">Tags</h2>
      <DataTable
        addComponent={<TagForm />}
        columns={columns()}
        data={data?.data || []}
        filterComponent={<FilterBase />}
        ifJustFilterComponent
        loading={isLoading}
        paginationComponent={
          <Suspense fallback={null}>
            <Pagination
              {...{
                items: total,
                page: pageIndex,
                pages: totalPages,
                limit: pageSize,
                showing,
                handleUpdatePage: navigateToPage,
                handleChangeLimit: setPageSize,
              }}
            />
          </Suspense>
        }
      />
    </div>
  );
}
