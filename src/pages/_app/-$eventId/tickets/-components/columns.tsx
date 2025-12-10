'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { tableDataButtonServer, tdbs } from '@/components/TableDataButton-server';
import type { GetEventTickets200 } from '@/http/generated';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Ticket = GetEventTickets200['data'][0];

export const columns: ColumnDef<Ticket>[] = [
  tdbs('number', 'N'),
  tdbs('member.name', 'Name'),
  {
    accessorKey: 'returned',
    header: tableDataButtonServer('Devolvidos', 'returned'),
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
  // {
  //   id: 'actions',
  //   enableHiding: false,
  //   cell: ({ row }) => (
  //     <TicketForm members={members} refetch={refetch} ticket={row.original} />
  //   ),
  // },
];
