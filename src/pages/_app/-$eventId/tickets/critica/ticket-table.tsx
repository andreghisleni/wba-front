'use client'

import React from 'react'

import { DataTable } from '@/components/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/react'

import { columns, Ticket } from './columns'

type IProps = {
  tickets: Ticket[]
}

export const TicketsTable: React.FC<IProps> = ({ tickets }) => {
  const { data } = trpc.getTicketsWithCritica.useQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets com critica</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data?.tickets || tickets}
          initialColumnVisibility={{ cleanName: false }}
        />
      </CardContent>
    </Card>
  )
}
