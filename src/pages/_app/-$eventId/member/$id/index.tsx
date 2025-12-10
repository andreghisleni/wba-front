import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetEventMemberById } from '@/http/generated';
import { AttachTicketToMemberDialog } from './-components/attach-ticket-to-member-dialog';
import { PaymentsTable } from './-components/payment-table';
import { ticketsColumns } from './-components/tickets-columns';

export const Route = createFileRoute('/_app/$eventId/member/$id/')({
  component: MemberPage,
});

function MemberPage() {
  const eventId = Route.useParams().eventId as string;
  const memberId = Route.useParams().id as string;

  const { data, isLoading } = useGetEventMemberById(eventId, memberId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">
        Dados do membro: {data?.visionId} - {data?.name} - {data?.session.name}
      </h2>
      <div className="flex w-full gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              addComponent={
                <AttachTicketToMemberDialog
                  eventId={eventId}
                  memberId={memberId}
                />
              }
              columns={ticketsColumns({ memberId })}
              data={data?.tickets || []}
            />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentsTable
              memberId={memberId}
              payments={data?.payments || []}
              toReceive={
                (data?.tickets?.filter((t) => !t.returned).length || 0) * 50
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
