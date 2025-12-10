'use client'

import Link from 'next/link'
import React from 'react'

import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/react'

import { columns, Member } from './columns'
import { ExportButton } from './export-all'

type IProps = {
  members: Member[]
}

export const TicketPaymentsTable: React.FC<IProps> = ({ members }) => {
  const { data, refetch } = trpc.getMembers.useQuery()
  // const [name, setName] = useLocalStorage('name')

  const d = data?.members || members

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros - Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {/* <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        /> */}
        <DataTable
          columns={columns({ refetch })}
          data={d}
          addComponent={
            <>
              <ExportButton />
              <Button variant="outline" asChild>
                <Link href="/app/settings/tickets/payments/import">
                  Importar
                </Link>
              </Button>
            </>
          }
        />
      </CardContent>
    </Card>
  )
}
