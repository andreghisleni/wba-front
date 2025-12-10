'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { tdb } from '@/components/TableDataButton';
import type { GetEventMembers200 } from '@/http/generated';
import { UnassignTicketButton } from './unassign-ticket-button';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Ticket = GetEventMembers200['data'][0]['tickets'][0];

export const columnsTickets = ({memberId}: {memberId: string}): ColumnDef<Ticket>[] => [
  tdb('number', 'N'),
  tdb('member.name', 'Name'),
  {
    accessorKey: 'returned',
    header: 'Critica',
    cell: ({ row }) => {
      return <span>{row.getValue('returned') ? 'Sim' : 'Não'}</span>;
    },
  },
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
    id: 'cleanName',
    accessorKey: 'member.cleanName',
    header: 'a',
    cell: 'a',
    size: 0,
    enableHiding: false,
  },
  {
    accessorKey: 'deliveredAt',
    header: 'Retirado em',
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return <span>{v ? format(new Date(v), 'dd/MM/yyyy HH:mm') : '-'}</span>;
    },
  },
  {
    accessorKey: 'name',
    header: 'Quem retirou sem ticket',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.name}</span>
        <span className="text-gray-500 text-sm">{row.original.phone}</span>
        <span className="text-gray-500 text-xs">
          {row.original.description}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'id',
    header: 'Ações',
    cell: ({ row }) => {
      return (
        <div className="flex flex-row space-x-2">
          <UnassignTicketButton
            id={row.original.id}
            isDelivered={!!row.original.deliveredAt}
            memberId={memberId}
          />
        </div>
      );
    },
  },
];
