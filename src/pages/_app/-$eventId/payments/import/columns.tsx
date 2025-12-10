'use client'

import { ColumnDef } from '@tanstack/react-table'

import { tdbNew } from '@/components/table/TableDataButton'
import { tdb } from '@/components/TableDataButton'

import { Item } from './page'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<Item>[] = [
  tdb('visionMemberId', 'Id Membro'),
  tdb('visionPaymentId', 'Id Pagamento'),
  tdbNew({
    name: 'type',
    label: 'Tipo',
    cell(c) {
      return c.row.original.type === 4 ? 'PIX' : 'Dinheiro'
    },
  }),
  tdb('value', 'Valor'),
  tdbNew({
    name: 'payedAt',
    label: 'Pago em',
    dataType: 'date',
  }),
]
