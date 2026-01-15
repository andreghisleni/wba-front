import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';
import { DataTable } from '@/components/data-table';
import { useGetBroadcastLists } from '@/http/generated';
import { columns } from './-components/columns';
import { ListForm } from './-components/list-form';

export const Route = createFileRoute('/_app/$organizationSlug/broadcast/list/')(
  {
    component: RouteComponent,
    params: z.object({
      organizationSlug: z.string(),
    }),
  }
);

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const { data, isLoading } = useGetBroadcastLists();

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">Listas de Transmissão</h2>
      <DataTable
        addComponent={<ListForm />}
        columns={columns({ organizationSlug })}
        data={data || []}
        loading={isLoading}
      // paginationComponent={
      //   <Suspense fallback={null}>
      //     <Pagination
      //       {...{
      //         items: total,
      //         page: pageIndex,
      //         pages: totalPages,
      //         limit: pageSize,
      //         showing,
      //         handleUpdatePage: navigateToPage,
      //         handleChangeLimit: setPageSize,
      //       }}
      //     />
      //   </Suspense>
      // }
      />
      {/* <pre>{JSON.stringify(data?.meta, null, 2)}</pre> */}
    </div>
  );
}
