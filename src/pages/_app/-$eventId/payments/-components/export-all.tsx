'use client'

import { format } from 'date-fns'
import xlsx from 'json-as-xlsx'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { nativeClient } from '@/lib/trpc/client'

export function ExportButton() {
  const { toast } = useToast()
  async function handleExport() {
    const data = await nativeClient.getTicketPayments.query()

    if (!data.ticketPayments) {
      toast({
        title: 'Erro',
        description: 'Nenhum dado encontrado para exportação.',
        variant: 'destructive',
      })
      return
    }

    xlsx(
      [
        {
          sheet: 'Pagamentos',
          columns: [
            { label: 'Id vision - Nome', value: 'name' },
            { label: 'Id pagamento', value: 'paymentVisionId' },
            { label: 'Valor', value: 'value' },
            { label: 'Tipo', value: 'type' },
            { label: 'Pago em', value: 'payedAt' },
          ],
          content: data.ticketPayments.map((item) => ({
            name: `${item.member.visionId} - ${item.member.name}`,
            paymentVisionId: item.visionId,
            value: item.amount,
            type: item.type === 'CASH' ? 'Dinheiro' : 'PIX',
            payedAt: format(new Date(item.payedAt), 'dd/MM/yyyy'),
          })),
        },
      ],
      {
        fileName: `pagamentos-${new Date().toISOString()}`,
      },
    )
    toast({
      title: 'Sucesso',
      description: 'Exportação realizada com sucesso.',
    })
  }

  return <Button onClick={() => handleExport()}>Exportar</Button>
}
