
import type { ColumnDef } from '@tanstack/react-table'

import type { GetEventMembers200 } from '@/http/generated'
import { tdb } from '@/components/TableDataButton'
import { tdbNew } from '@/components/table/TableDataButton'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Member = GetEventMembers200['data'][0] & {
  totalTickets: number;
  totalTicketsToDeliver: number;
};

export const columns = ({
  eventId,
  ticketRanges = [],
}: {
  eventId: string;
  ticketRanges?: {
    id: string;
    type: string;
  }[];
}): ColumnDef<Member>[] => [
  tdb('visionId', 'Vision', 80),
  tdb('name', 'Nome'),
  // {
  //   accessorKey: 'cleanName',
  //   header: 'Nome',
  //   cell: ({ row }) => {
  //     return <span>{row.original.name}</span>
  //   },
  // },
  // tdb('register', 'Registro'),
  // tdb('session.name', 'Seção'),

  tdb('totalTickets', 'N° Tickets'),
  tdb('totalReturned', 'N° Retornos'),
  // {
  //   id: 'calabresa',
  //   header: 'Calabresa',
  //   cell: ({ row }) => {
  //     return (
  //       <div className="flex flex-col">
  //         {row.original.ticketRanges
  //           .filter((f) => f.start < 1001)
  //           .map((f, i) => (
  //             <span key={i}>
  //               {f.start.toString().padStart(4, '0')}
  //               {' - '}
  //               {f.end.toString().padStart(4, '0')}
  //             </span>
  //           ))}
  //       </div>
  //     )
  //   },
  // },
  // {
  //   id: 'mistas',
  //   header: 'Mistas',
  //   cell: ({ row }) => {
  //     return (
  //       <div className="flex flex-col">
  //         {row.original.ticketRanges
  //           .filter((f) => f.start > 1999)
  //           .map((f, i) => (
  //             <span key={i}>
  //               {f.start.toString().padStart(4, '0')}
  //               {' - '}
  //               {f.end.toString().padStart(4, '0')}
  //             </span>
  //           ))}
  //       </div>
  //     )
  //   },
  // },

  tdbNew({
    name: 'totalAmount',
    label: 'Valor Total',
    dataType: 'currency',
  }),
  tdbNew({
    name: 'totalPayedWithPix',
    label: 'Pgto Pix',
    dataType: 'currency',
  }),
  tdbNew({
    name: 'totalPayedWithCash',
    label: 'Pgto Dinheiro',
    dataType: 'currency',
  }),
  tdbNew({
    name: 'totalPayed',
    label: 'Pgto Total',
    dataType: 'currency',
  }),
  tdbNew({
    name: 'total',
    label: 'Saldo',
    dataType: 'currency',
  }),

  // {
  //   id: 'actions',
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     if (!row.original.tickets || row.original.tickets.length === 0) {
  //       return <span>Sem ingressos</span>
  //     }

  //     if (row.original.totalTickets === row.original.totalReturned) {
  //       return <span>Todos retornados</span>
  //     }

  //     if (row.original.total >= 0) {
  //       return (
  //         <div className="flex flex-col items-center gap-2">
  //           <span>Pago</span>
  //           <MemberPaymentsTableModal
  //             memberId={row.original.id}
  //             memberName={row.original.name}
  //             payments={row.original.ticketPayments}
  //             visionId={row.original.visionId || ''}
  //           />
  //         </div>
  //       )
  //     }

  //     return (
  //       <div className="flex flex-col items-center gap-2">
  //         <TicketPaymentForm refetch={refetch} memberId={row.original.id} />
  //         <ReturnTicketForm
  //           refetch={refetch}
  //           memberId={row.original.id}
  //           ticketsReturn={row.original.tickets.filter((t) => !t.returned)}
  //           total={row.original.total}
  //         />
  //         <ToggleIsAllConfirmedButNotYetFullyPaidButton
  //           memberId={row.original.id}
  //           refetch={refetch}
  //           isAllConfirmedButNotYetFullyPaid={
  //             row.original.isAllConfirmedButNotYetFullyPaid
  //           }
  //         />
  //         <MemberPaymentsTableModal
  //           memberId={row.original.id}
  //           memberName={row.original.name}
  //           refetchMembers={refetch}
  //           payments={row.original.ticketPayments}
  //           visionId={row.original.visionId || ''}
  //         />
  //         {/* <--- New Button/Modal */}
  //       </div>
  //     )
  //   },
  // },
]
