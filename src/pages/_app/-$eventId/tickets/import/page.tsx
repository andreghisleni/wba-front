'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { nativeClient } from '@/lib/trpc/client'
import { trpc } from '@/lib/trpc/react'

import { columns } from './columns'
import { ExportWithErrorButton } from './export-with-error-button'

export type Item = {
  visionId: string
  name: string
  session: string
  start: number
  end: number
  error?: string[]
  memberId?: string
  updated?: boolean
}

export default function MyNextJsExcelSheet() {
  const [items, setItems] = useState<Item[]>([])

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
        (d as Item[]).map((i) => {
          if (!i.start || (!i.start && !i.end)) {
            i.error = ['Número de ingressos inválido']
          }

          return { ...i }
        }),
      )
    })
  }

  const { toast } = useToast()

  const createTickets = trpc.createTickets.useMutation({
    onError: (error) => {
      console.log(error)
      toast({
        title: 'Erro ao cadastrar tickets',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Tickets cadastrados com sucesso',
      })
    },
  })

  const handleCreate = () => {
    const itensWithCorrectNumbers = items.filter(
      (i) => !i.error?.includes('Número de ingressos inválido'),
    )

    // generate tickets here if have start and end create tickets for each number if not create only one ticket, ticket need just number and memberId
    const tickets = itensWithCorrectNumbers
      .map((item) => {
        if (item.start && item.end) {
          return Array.from({ length: item.end - item.start + 1 }, (_, i) => ({
            memberId: item.memberId,
            number: item.start + i,
          }))
        }

        return {
          memberId: item.memberId,
          number: item.start,
        }
      })
      .flat()

    createTickets.mutate({
      data: tickets,
    })
  }

  useEffect(() => {
    ;(async () => {
      if (!items.length || items.filter((i) => i.updated).length) {
        return
      }

      const itensWithVisionId = items.filter((i) => i.visionId)
      const visionIds = Array.from(
        new Set(itensWithVisionId.map((i) => i.visionId)),
      ).map((i) => i.toString())

      const itensWithOutVisionId = items.filter((i) => !i.visionId)
      const names = Array.from(new Set(itensWithOutVisionId.map((i) => i.name)))

      console.log({ visionIds, names })

      const members = await nativeClient.getMembersWithVisionIdsOrNames.query({
        visionIds,
        names,
      })

      const updatedItems = items.map((i) => {
        const member = members.members.find(
          (m) =>
            m.visionId === i.visionId?.toString() ||
            m.cleanName ===
              i.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''),
        )

        console.log({ member, i })

        if (member) {
          i.memberId = member.id
        } else {
          i.error = [...(i.error || []), 'Membro não encontrado']
        }
        i.updated = true

        return i
      })

      setItems(updatedItems)

      console.log({ members })
    })()
  }, [items])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar tickets</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between gap-16">
        <div className="min-w-96 space-y-6 p-4">
          <input
            type="file"
            onChange={(e) => {
              if (!e.target.files) {
                return
              }

              const file = e.target.files[0]
              readExcel(file)
            }}
          />
          <ul className="list-disc">
            <li>
              <span>Total de registros: </span> {items.length}
            </li>
            <li>
              <span>Total sem visionId: </span>{' '}
              {items.filter((i) => !i.visionId).length}
            </li>
            <li>
              <span>Total sem numero de ingressos: </span>{' '}
              {items.filter((i) => !i.start || (!i.start && !i.end)).length}
            </li>
            <li>
              <span>Total com erro: </span>{' '}
              {items.filter((i) => i.error?.length).length}
            </li>
            <li>
              <span>Total com erro de numeração: </span>{' '}
              {
                items.filter((i) =>
                  i.error?.includes('Número de ingressos inválido'),
                ).length
              }
            </li>
            <li>
              <span>Total sem membros cadastrados: </span>{' '}
              {items.filter((i) => !i.memberId).length}
            </li>
          </ul>

          <Button onClick={handleCreate}>Cadastrar tickets</Button>
          <ExportWithErrorButton
            itensWithError={items.filter((i) => i.error?.length)}
            disabled={!items.length || !items.filter((i) => i.updated).length}
          />
        </div>

        <div>
          <DataTable columns={columns} data={items} />
        </div>
      </CardContent>
    </Card>
  )
}
