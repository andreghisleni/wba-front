import { createFileRoute } from '@tanstack/react-router';

import { Suspense } from 'react';
import { Loading } from './-components/summary/loading';
import { TotalDeliveredTicket } from './-components/summary/total-delivered-tickets';
import { TotalDeliveredTicketWithCritica } from './-components/summary/total-delivered-tickets-with-critica';
import { TotalMembers } from './-components/summary/total-members';
import { TotalPayedTicket } from './-components/summary/total-payed-tickets';
import { TotalPredictedPayedTicket } from './-components/summary/total-predicted-to-payed-tickets';
import { TotalTicketRanges } from './-components/summary/total-ticket-ranges';
import { TotalTicket } from './-components/summary/total-tickets';
import { TotalTicketWithoutCritica } from './-components/summary/total-tickets-without-critica';
import { TotalTicketWithoutDelivered } from './-components/summary/total-tickets-without-delivered';
import { TotalTicketWithoutImported } from './-components/summary/total-tickets-without-imported';
import { TotalValuePayedTicket } from './-components/summary/total-value-payed-tickets';

export const Route = createFileRoute('/_app/$eventId/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { eventId } = Route.useParams();

  return (
    <div className="px-8">
      <h2 className="font-bold text-3xl tracking-tight">Dashboard</h2>
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalTicket eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalTicketWithoutCritica eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalPayedTicket eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalPredictedPayedTicket eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalTicketWithoutImported eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalValuePayedTicket eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalDeliveredTicket eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalDeliveredTicketWithCritica eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalMembers eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalTicketWithoutDelivered eventId={eventId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<Loading />}>
            <TotalTicketRanges eventId={eventId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
