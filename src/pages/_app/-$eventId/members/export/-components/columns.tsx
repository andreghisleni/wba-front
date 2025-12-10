/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import type { ColumnDef } from '@tanstack/react-table';
import { tdb } from '@/components/TableDataButton';
import { tdbNew } from '@/components/table/TableDataButton';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type Member = {
  visionId: string;
  name: string;
  session: {
    name: string;
  };
  totalTickets: number;
  numbers: string[];
  numericNumbers: number[];
  ticketsARetirar: number;
};

type Props = {
  ticketRanges?: {
    id: string;
    type: string;
    start: number;
    end: number;
  }[];
}

export const columns = ({ ticketRanges }: Props): ColumnDef<Member>[] => [
  tdb('visionId', 'Vision'),
  tdb('name', 'Nome'),
  tdb('session.name', 'Seção'),
  tdb('totalTickets', 'N° Tickets'),
  tdbNew({ name: 'numbers', label: 'Números', dataType: 'array' }),
  tdbNew({ name: 'ticketsARetirar', label: 'A retirar' }),
  ...ticketRanges?.map((range) => ({
    accessorKey: `faixa-${range.id}`,
    header: range.type,
    cell: ({ row }: any) => {
      const member = row.original;
      const n = member.numericNumbers
      .filter((number: number) =>
        Number(number) >= range.start && Number(number) <= range.end
      );
      return <span>{n.join(', ')}</span>;
    },
  })) || [],
];
