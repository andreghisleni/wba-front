import { BarChart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetEventDashboardDataById } from '@/http/generated';
import { Loading } from './loading';
// import { serverClient } from '@/lib/trpc/server'

export function TotalTicketWithoutCritica({ eventId }: { eventId: string }) {
  const { data, isLoading } = useGetEventDashboardDataById(eventId);

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return null;
  }

  const {
    totalWithoutCritica,
    totalWithoutCriticaCalabresa,
    totalWithoutCriticaMista,
  } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-base">
          Total de ingressos entregues menos os devolvidos
        </CardTitle>
        <BarChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        <span className="font-bold text-2xl">
          {String(totalWithoutCritica).padStart(4, '0')}
        </span>
        <p className="text-muted-foreground text-xs">
          Calabresa: {String(totalWithoutCriticaCalabresa).padStart(4, '0')}
        </p>
        <p className="text-muted-foreground text-xs">
          Mista: {String(totalWithoutCriticaMista).padStart(4, '0')}
        </p>
      </CardContent>
    </Card>
  );
}
