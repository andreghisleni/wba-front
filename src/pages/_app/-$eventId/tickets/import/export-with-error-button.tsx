import xlsx from 'json-as-xlsx'

import { Button } from '@/components/ui/button'

import { Item } from './page'

export function ExportWithErrorButton({
  itensWithError,
  disabled = false,
}: {
  itensWithError: Item[]
  disabled?: boolean
}) {
  function handleExport() {
    xlsx(
      [
        {
          sheet: 'Persons',
          columns: [
            { label: 'VisionId', value: 'visionId' },
            { label: 'Nome', value: 'name' },
            { label: 'Seção', value: 'session' },
            { label: 'Inicio', value: 'start' },
            { label: 'Fim', value: 'end' },
            { label: 'Erros', value: 'error' },
          ],
          content: itensWithError.map((item) => ({
            ...item,
            error: item.error?.join('\n') || '',
          })),
        },
      ],
      {
        fileName: 'People Excel',
      },
    )
  }

  return (
    <Button onClick={handleExport} disabled={disabled}>
      Exportar com erro
    </Button>
  )
}
