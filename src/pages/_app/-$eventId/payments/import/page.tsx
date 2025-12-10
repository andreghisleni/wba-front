'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

import { DataTable } from '@/components/data-table'
import { ShowJson } from '@/components/show-json'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/lib/trpc/react'

import { columns } from './columns'

export type Item = {
  visionMemberId: number
  visionPaymentId: number
  type: 4 | 7 // 4 = PIX, 7 = Dinheiro
  value: string
  payedAt: string
  toCreate?: boolean
}

export default function MyNextJsExcelSheet() {
  const [items, setItems] = useState<Item[]>([])
  const ticketPayments = trpc.getTicketPaymentsByVisionId.useQuery(
    {
      visionIds: items.map((item) => item.visionPaymentId.toString()),
    },
    {
      enabled: items.length > 0,
    },
  )
  const itemsToCreate = useMemo(() => {
    if (!ticketPayments.data?.ticketPayments) {
      return items
    }

    const existingPayments = ticketPayments.data.ticketPayments.map(
      (payment) => payment.visionId,
    )

    const newItems = items.filter(
      (item) => !existingPayments.includes(`${item.visionPaymentId}`),
    )

    return newItems
  }, [items, ticketPayments.data?.ticketPayments])
  const itemsCreated = useMemo(() => {
    if (!ticketPayments.data?.ticketPayments) {
      return []
    }

    const existingPayments = ticketPayments.data.ticketPayments.map(
      (payment) => payment.visionId,
    )

    const newItems = items.filter((item) =>
      existingPayments.includes(`${item.visionPaymentId}`),
    )

    return newItems
  }, [items, ticketPayments.data?.ticketPayments])

  const readExcel = (file) => {
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsArrayBuffer(file)
      fileReader.onload = (e) => {
        if (!e.target) {
          return
        }
        const bufferArray = e.target.result
        const wb = XLSX.read(bufferArray, {
          type: 'buffer',
        })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        resolve(data)
      }
      fileReader.onerror = (error) => {
        reject(error)
      }
    })
    promise.then((d) => {
      setItems(
        (d as Item[])
          // .filter((i) => i.visionMemberId && i.visionMemberId !== '#N/A')
          .map((item) => ({
            ...item,
            payedAt: item.payedAt
              ? new Date(item.payedAt).toISOString()
              : new Date().toISOString(),
          })),
      )
    })
  }

  const { toast } = useToast()

  const createPayments = trpc.createTicketPayments.useMutation({
    onError: (error) => {
      console.log(error)
      toast({
        title: 'Erro ao cadastrar pagamentos',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Pagamentos cadastrados com sucesso',
      })
      setItems([])
      ticketPayments.refetch()
    },
  })

  const handleCreate = () => {
    createPayments.mutate({
      payments: itemsToCreate.map((item) => ({
        visionId: item.visionPaymentId.toString(),
        visionMemberId: item.visionMemberId.toString(),
        amount: parseFloat(item.value),
        type: item.type === 4 ? 'PIX' : 'CASH',
        payedAt: new Date(item.payedAt),
      })),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar pagamentos</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between gap-16">
        <div className="min-w-96">
          <input
            type="file"
            onChange={(e) => {
              if (!e.target.files) {
                return
              }

              const file = e.target.files[0]
              readExcel(file)
            }}
            accept=".xlsx"
          />
          <ul>
            <li>
              <span>Total a importar: </span> {items.length}
            </li>
            <li>
              <span>Total já cadastrados: </span>{' '}
              {ticketPayments.data?.ticketPayments.length || 0}
            </li>
            <li>
              <span>Total a cadastrar: </span> {itemsToCreate.length}
            </li>
          </ul>

          <Button onClick={handleCreate} disabled={itemsToCreate.length === 0}>
            Cadastrar
          </Button>

          {/* <ShowJson
            data={{
              new: itemsToCreate,

              items,
            }}
          /> */}
        </div>

        <div className="flex-1">
          <DataTable
            columns={columns}
            data={[
              ...itemsToCreate.map((i) => ({ ...i, toCreate: true })),
              ...itemsCreated,
            ]}
            rowBgColor={({ original }) =>
              original.toCreate
                ? 'bg-red-200 dark:bg-red-800/50 group-hover:bg-red-200/50 dark:group-hover:bg-red-800/100'
                : ''
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
