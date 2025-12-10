import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { tdb } from '@/components/TableDataButton';
import { tdbNew } from '@/components/table/TableDataButton';
import type { GetEventMemberById200 } from '@/http/generated';
import { ToggleReturnedTicketButton } from './toggle-returned-ticket';
import { UnassignTicketButton } from '../../../members/-components/unassign-ticket-button';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Ticket = NonNullable<GetEventMemberById200>['tickets'][0];

export const ticketsColumns = ({memberId}: {memberId: string}): ColumnDef<Ticket>[] => [
  tdb('number', 'N'),
  {
    accessorKey: 'returned',
    header: 'Devolvidos',
    cell: ({ row }) => {
      return <span>{row.getValue('returned') ? 'Sim' : 'Não'}</span>;
    },
  },
  tdbNew({
    name: 'deliveredAt',
    label: 'Retirado em',
    dataType: 'date-time',
  }),
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => {
      return (
        <span>
          {format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy HH:mm')}
        </span>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex gap-2">
        <ToggleReturnedTicketButton
        isReturnedTicket={row.original.returned}
        ticketId={row.original.id}
      />
      <UnassignTicketButton
        id={row.original.id}
        isDelivered={!!row.original.deliveredAt}
        memberId={memberId}
      />
      </div>
    ),
  },
];
