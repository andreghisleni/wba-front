import { BarChart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetEventDashboardDataById } from '@/http/generated';
import { formatToBRL } from '@/utils/formatToBRL';
import { Loading } from './loading';
// import { serverClient } from '@/lib/trpc/server'

export function TotalValuePayedTicket({ eventId }: { eventId: string }) {
  const { data, isLoading } = useGetEventDashboardDataById(eventId);

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return null;
  }

  const { totalValuePayedTickets, totalValuePayedTicketsOnLastWeek } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-base">
          Total de ingressos pagos
        </CardTitle>
        <BarChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        <span className="font-bold text-2xl">
          {formatToBRL(totalValuePayedTickets)}
        </span>
        <p className="text-muted-foreground text-xs">
          + {formatToBRL(totalValuePayedTicketsOnLastWeek)} nos últimos 7 dias
        </p>
      </CardContent>
    </Card>
  );
}
