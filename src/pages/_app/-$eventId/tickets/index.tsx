import { createFileRoute } from '@tanstack/react-router';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Suspense } from 'react';
import { DataTable } from '@/components/data-table';
import { FilterBase } from '@/components/filter-base';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useGetEventTickets } from '@/http/generated';
import { columns } from './-components/columns';

export const Route = createFileRoute('/_app/$eventId/tickets/')({
  component: RouteComponent,
});

function RouteComponent() {
  const eventId = Route.useParams().eventId;
  const [{ pageIndex, pageSize, filter, memberId, ...rest }] = useQueryStates({
    // pageIndex é um inteiro, com valor padrão 1
    pageIndex: parseAsInteger.withDefault(1),
    // pageSize é uma string, com valor padrão '10' (pode ser parseAsInteger se preferir)
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(''), // Exemplo de filtro adicional
    memberId: parseAsString.withDefault(''), // Exemplo de filtro adicional
    'ob.number': parseAsString.withDefault(''), // Exemplo de ordenação
    'ob.member.name': parseAsString.withDefault(''), // Exemplo de ordenação
    'ob.deliveredAt': parseAsString.withDefault(''), // Exemplo de ordenação
    'ob.returned': parseAsString.withDefault(''), // Exemplo de ordenação
    'ob.createdAt': parseAsString.withDefault(''), // Exemplo de ordenação
  });
  // const { data: sessionsData } = useGetAllScoutSessions();
  const { data, isLoading } = useGetEventTickets(eventId, {
    'p.page': pageIndex,
    'p.pageSize': pageSize,
    'f.filter': filter.length > 0 ? filter : undefined,
    'f.memberId': memberId.length > 0 ? memberId : undefined,
    'ob.number': rest['ob.number'] || undefined,
    'ob.member.name': rest['ob.member.name'] || undefined,
    'ob.deliveredAt': rest['ob.deliveredAt'] || undefined,
    'ob.returned': rest['ob.returned'] || undefined,
    'ob.createdAt': rest['ob.createdAt'] || undefined,
  });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: data?.meta.total,
      showing: data?.data.length,
    });

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">Tickets</h2>
      <DataTable
        addComponent={
          <>
            {/* <Button asChild variant="outline">
              <Link href="/app/settings/tickets/ranges">
                Faixas de ingressos
              </Link>
            </Button>
            <Button asChild>
              <Link href="/app/settings/tickets/critica">Importar</Link>
            </Button> */}
            {/* <TicketForm
              members={membersData?.members || []}
              refetch={refetch}
            /> */}
          </>
        }
        columns={columns}
        data={data?.data || []}
        filterComponent={
          <FilterBase
          // additionalFieldsSchema={z.object({
          //   session: z.string().optional().describe('Sessão'),
          // })}
          // values={{
          //   session:
          //     sessionsData?.map((s) => ({
          //       label: s.name,
          //       value: s.id,
          //     })) || [],
          // }}
          />
        }
        ifJustFilterComponent
        initialColumnVisibility={{ cleanName: false }}
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
