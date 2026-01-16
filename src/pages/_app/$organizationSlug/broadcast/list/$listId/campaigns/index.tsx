import { createFileRoute } from '@tanstack/react-router';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Suspense } from 'react';
import z from 'zod';
import { DataTable } from '@/components/data-table';
import { FilterBase } from '@/components/filter-base';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import {
  useGetBroadcastCampaigns,
  useGetBroadcastList,
} from '@/http/generated';
import { CampaignForm } from './-components/campaign-form';
import { columns } from './-components/columns';

export const Route = createFileRoute(
  '/_app/$organizationSlug/broadcast/list/$listId/campaigns/'
)({
  component: RouteComponent,
  params: z.object({
    organizationSlug: z.string(),
    listId: z.string(),
  }),
});

const filterSchema = z.object({
  status: z.string().optional().describe('Status'),
});

const values = {
  status: [
    { value: 'DRAFT', label: 'Rascunho' },
    { value: 'PROCESSING', label: 'Processando' },
    { value: 'COMPLETED', label: 'Concluído' },
    { value: 'PAUSED', label: 'Pausado' },
    { value: 'FAILED', label: 'Falhou' },
    { value: 'CANCELED', label: 'Cancelado' },
  ]
}

function RouteComponent() {
  const { listId, organizationSlug } = Route.useParams();
  const { data: list, isLoading: isListLoading } = useGetBroadcastList(listId);
  const [{ pageIndex, pageSize, filter, status }] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
  });
  const { data: campaignsData, isLoading: isCampaignsLoading } =
    useGetBroadcastCampaigns(listId, {
      'f.filter': filter.length > 0 ? filter : undefined,
      'f.status': status.length > 0 ? status : undefined,
      'p.page': pageIndex,
      'p.pageSize': pageSize,
    });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: campaignsData?.meta.total,
      showing: campaignsData?.data.length,
    });

  if (isListLoading || isCampaignsLoading) {
    return <div>Carregando campanhas...</div>;
  }

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">
        Campanhas da lista de transmissão: {list?.name}
      </h2>
      <DataTable
        addComponent={<CampaignForm listId={listId} />}
        columns={columns({
          organizationSlug,
        })}
        data={campaignsData?.data || []}
        filterComponent={
          <FilterBase additionalFieldsSchema={filterSchema} values={values} />
        }
        ifJustFilterComponent
        loading={isCampaignsLoading}
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
