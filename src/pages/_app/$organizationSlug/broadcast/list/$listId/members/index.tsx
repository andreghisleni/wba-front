import { createFileRoute, Link } from '@tanstack/react-router';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Suspense } from 'react';
import z from 'zod';
import { DataTable } from '@/components/data-table';
import { FilterBase } from '@/components/filter-base';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { usePagination } from '@/hooks/use-pagination';
import {
  useGetBroadcastList,
  useGetBroadcastListMembers,
} from '@/http/generated';
import { columns } from './-components/columns';
import { MemberForm } from './-components/member-form';

export const Route = createFileRoute(
  '/_app/$organizationSlug/broadcast/list/$listId/members/'
)({
  component: RouteComponent,
  params: z.object({
    organizationSlug: z.string(),
    listId: z.string(),
  }),
});

function RouteComponent() {
  const { listId, organizationSlug } = Route.useParams();
  const { data: list, isLoading: isListLoading } = useGetBroadcastList(listId);
  const [{ pageIndex, pageSize, filter }] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    // pageSize é uma string, com valor padrão '10' (pode ser parseAsInteger se preferir)
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(''), // Exemplo de filtro adicional
  });
  const { data: membersData, isLoading: isMembersLoading } =
    useGetBroadcastListMembers(listId, {
      'f.filter': filter.length > 0 ? filter : undefined,
      'p.page': pageIndex,
      'p.pageSize': pageSize,
    });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: membersData?.meta.total,
      showing: membersData?.data.length,
    });

  if (isListLoading || isMembersLoading) {
    return <div>Loading list...</div>;
  }

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">
        Membros da lista de transmissão: {list?.name}
      </h2>
      <DataTable
        addComponent={
          <>
            <MemberForm additionalParams={list?.additionalParams || []} />
            <Button asChild color="yellow" key="import" variant="outline">
              <Link
                params={{
                  listId,
                  organizationSlug,
                }}
                to="/$organizationSlug/broadcast/list/$listId/members/import"
              >
                Importar
              </Link>
            </Button>
          </>
        }
        columns={columns({
          organizationSlug,
          additionalParams: list?.additionalParams || [],
        })}
        data={membersData?.data || []}
        filterComponent={<FilterBase />}
        ifJustFilterComponent
        loading={isMembersLoading}
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
      {/* <pre>{JSON.stringify(data?.meta, null, 2)}</pre> */}
    </div>
  );
}
