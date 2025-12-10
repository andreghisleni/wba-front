import xlsx from 'json-as-xlsx';

import { Button } from '@/components/ui/button';
import { agruparNumbers } from '@/utils/agrupar-numaros';

import type { Member, Ticket } from '..';

export function ExportButton({
  members,
  tickets,
  ticketsWithCritica,
  ticketRanges,
}: {
  members: Member[];
  tickets: Ticket[];
  ticketsWithCritica: Ticket[];
  ticketRanges?: {
    id: string;
    type: string;
    start: number;
    end: number;
  }[];
}) {
  function handleExport() {
    xlsx(
      [
        {
          sheet: 'Membros',
          columns: [
            { label: 'VisionId', value: 'visionId' },
            { label: 'Nome', value: 'name' },
            { label: 'Seção', value: 'session' },
            { label: 'N° Tickets', value: 'tickets' },
            { label: 'Números', value: 'numbers' },
            { label: 'A retirar', value: 'tickets-a-retirar' },
            ...ticketRanges?.map((range) => ({
              label: range.type,
              value: range.type,
            })) || [],
          ],
          content: members.map((item) => ({
            visionId: item.visionId,
            name: item.name,
            session: item.session.name,
            tickets: item.tickets.length,
            numbers: agruparNumbers(item.tickets.map((t) => t.number)).join(
              '\n'
            ),
            'tickets-a-retirar': item.tickets.filter(
              (t) => !(t.deliveredAt || t.returned)
            ).length,
            // 'tickets-a-retirar-calabresa': item.tickets.filter(
            //   (t) => !(t.deliveredAt || t.returned) && t.number <= 1000
            // ).length,
            // 'tickets-a-retirar-mista': item.tickets.filter(
            //   (t) => !(t.deliveredAt || t.returned) && t.number >= 2000
            // ).length,

            ...ticketRanges?.reduce((acc, range) => {
              return {
                // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
                ...acc,
                [range.type]: item.tickets
                .filter(
                  (t) =>
                    t.number >= range.start &&
                    t.number <= range.end
                ).map((t) => t.number).join(', '),
              };
            }, {}) || {},
          })),
        },
        {
          sheet: 'Tickets',
          columns: [
            { label: 'N', value: 'number' },
            { label: 'Nome', value: 'name' },
            { label: 'Seção', value: 'session' },
            { label: 'Critica', value: 'returned' },
          ],
          content: tickets.map((t) => ({
            number: t.number,
            name: t.member?.name || 'Sem nome',
            session: t.member?.session.name || 'Sem seção',
            returned: t.returned ? 'Sim' : 'Não',
          })),
        },
        {
          sheet: 'Tickets com crítica',
          columns: [
            { label: 'N', value: 'number' },
            { label: 'Nome', value: 'name' },
            { label: 'Seção', value: 'session' },
            { label: 'Critica', value: 'returned' },
          ],
          content: ticketsWithCritica.map((t) => ({
            number: t.number,
            name: t.member?.name || 'Sem nome',
            session: t.member?.session.name || 'Sem seção',
            returned: t.returned ? 'Sim' : 'Não',
          })),
        },
      ],
      {
        fileName: 'tickets-nao-retirados',
      }
    );
  }

  return <Button onClick={handleExport}>Exportar</Button>;
}
