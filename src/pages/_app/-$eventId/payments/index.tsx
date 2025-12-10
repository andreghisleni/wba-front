
import { Suspense } from "react";

import { DataTable } from "@/components/data-table";
import { columns } from "./-components/columns";
import {
  useGetAllScoutSessions,
  useGetEventById,
  useGetEventMembers,
} from "@/http/generated";
import { createFileRoute } from "@tanstack/react-router";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { usePagination } from "@/hooks/use-pagination";
import { FilterBase } from "@/components/filter-base";
import z from "zod";
import { Pagination } from "@/components/pagination";

export const Route = createFileRoute("/_app/$eventId/payments/")({
  component: RouteComponent,
});

function RouteComponent() {
  const eventId = Route.useParams().eventId;
  const { data: event } = useGetEventById(eventId);
  const [{ pageIndex, pageSize, filter, session, ...rest }] = useQueryStates({
    // pageIndex é um inteiro, com valor padrão 1
    pageIndex: parseAsInteger.withDefault(1),
    // pageSize é uma string, com valor padrão '10' (pode ser parseAsInteger se preferir)
    pageSize: parseAsInteger.withDefault(10),
    filter: parseAsString.withDefault(""), // Exemplo de filtro adicional
    session: parseAsString.withDefault(""), // Exemplo de filtro adicional
    "ob.order": parseAsString.withDefault(""), // Exemplo de ordenação
    "ob.visionId": parseAsString.withDefault(""), // Exemplo de ordenação
    "ob.name": parseAsString.withDefault(""), // Exemplo de ordenação
    "ob.register": parseAsString.withDefault(""), // Exemplo de ordenação
    "ob.session.name": parseAsString.withDefault(""), // Exemplo de ordenação
  });
  const { data: sessionsData } = useGetAllScoutSessions();
  const { data, isLoading } = useGetEventMembers(eventId, {
    "p.page": pageIndex,
    "p.pageSize": pageSize,
    "f.filter": filter.length > 0 ? filter : undefined,
    "f.sessionId": session.length > 0 ? session : undefined,
    "ob.order": rest["ob.order"] || undefined,
    "ob.visionId": rest["ob.visionId"] || undefined,
    "ob.name": rest["ob.name"] || undefined,
    "ob.register": rest["ob.register"] || undefined,
    "ob.session-name": rest["ob.session.name"] || undefined,
  });

  const { totalPages, total, navigateToPage, setPageSize, showing } =
    usePagination({
      total: data?.meta.total,
      showing: data?.data.length,
    });

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">
        Pagamentos dos membros
      </h2>
      {/* <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        /> */}
      <DataTable
        addComponent={
          <>
            {/* <ExportButton /> */}
            {/* <Button variant="outline" asChild>
                <Link to="/app/settings/tickets/payments/import">
                  Importar
                </Link>
              </Button> */}
          </>
        }
        columns={columns({
          eventId,
          ticketRanges: event?.autoGenerateTicketsTotalPerMember
            ? undefined
            : event?.ticketRanges || [],
        })}
        data={
          data?.data.map((member) => ({
            ...member,
            totalTickets: member.tickets.length,
            totalTicketsToDeliver: member.tickets.filter(
              (ticket) => !ticket.deliveredAt
            ).length,
          })) || []
        }
        filterComponent={
          <FilterBase
            additionalFieldsSchema={z.object({
              session: z.string().optional().describe("Sessão"),
            })}
            values={{
              session:
                sessionsData?.map((s) => ({
                  label: s.name,
                  value: s.id,
                })) || [],
            }}
          />
        }
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
