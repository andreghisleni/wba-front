import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "@/components/data-table";
import {
  type GetEventExportData200,
  useGetEventById,
  useGetEventExportData,
} from "@/http/generated";
import { agruparNumbers } from "@/utils/agrupar-numaros";
import { columns } from "./-components/columns";
import { ExportButton } from "./-components/export-button";

export type Member = GetEventExportData200["members"][0];
export type Ticket = GetEventExportData200["tickets"][0];

export const Route = createFileRoute("/_app/$eventId/members/export/")({
  component: RouteComponent,
});

function RouteComponent() {
  const eventId = Route.useParams().eventId as string;
  const { data: event } = useGetEventById(eventId);
  const { data } = useGetEventExportData(eventId);

  const members = data?.members || [];

  const tickets = data?.tickets || [];

  const ticketsWithCritica = data?.ticketsWithCritica || [];

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">
        Exportar ingressos não vendidos
      </h2>
      <div className="flex justify-between gap-16">
        <div className="min-w-96">
          <ul>
            <li>
              <span>Total de membros com tickets para retirar: </span>{" "}
              {members.length}
            </li>
            <li>
              <span>Total de tickets para retirar: </span> {tickets.length}
            </li>
            <li>
              <span>Total de tickets com crítica: </span>{" "}
              {ticketsWithCritica.length}
            </li>
          </ul>

          <ExportButton
            members={members}
            ticketRanges={
              event?.autoGenerateTicketsTotalPerMember
                ? undefined
                : event?.ticketRanges || []
            }
            tickets={tickets}
            ticketsWithCritica={ticketsWithCritica}
          />
        </div>
        <div className="flex-1">
          <DataTable
            columns={columns({
              ticketRanges: event?.autoGenerateTicketsTotalPerMember
                ? undefined
                : event?.ticketRanges || [],
            })}
            data={members.map((member) => ({
              visionId: member.visionId || "Sem VisionId",
              name: member.name,
              session: member.session,
              totalTickets: member.tickets.length,
              numbers: agruparNumbers(member.tickets.map((t) => t.number)),
              ticketsARetirar: member.tickets.filter(
                (t) => !(t.deliveredAt || t.returned)
              ).length,
              numericNumbers: member.tickets.map((t) => Number(t.number)),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
