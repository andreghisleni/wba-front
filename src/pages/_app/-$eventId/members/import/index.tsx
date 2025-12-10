import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
// biome-ignore lint/performance/noNamespaceImport: XLSX library requires namespace import
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getEventMembersQueryKey,
  useCreateManyEventMembers,
  useGetEventById,
} from '@/http/generated';
import { columns } from './-components/columns';

export type Item = {
  order: number;
  VISION: string;
  name: string;
  session: string;
  register: string;
}

export const Route = createFileRoute('/_app/$eventId/members/import/')({
  component: RouteComponent,
});

function RouteComponent() {
  const eventId = Route.useParams().eventId as string;
  const { data: event } = useGetEventById(eventId);
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Item[]>([]);

  // biome-ignore lint/suspicious/noExplicitAny: file parameter from input element
  const readExcel = (file: any) => {
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = (e) => {
        if (!e.target) {
          return;
        }
        const bufferArray = e.target.result;
        const wb = XLSX.read(bufferArray, {
          type: 'buffer',
        });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        resolve(data);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
    promise.then((d) => {
      const itemsComOrdem = (d as Item[])
        .filter((i) => i.name && i.name !== '#N/A') // 1. Filtra primeiro
        .map((item, index) => ({
          // 2. Depois adiciona a ordem
          ...item,
          register: item.register ? String(item.register).replace(' ', '').split('-')[0] : '',
          order: index + 1,
          ...(!event?.autoGenerateTicketsTotalPerMember &&
            event?.ticketRanges &&
            event?.ticketRanges.length > 0 ?
            event.ticketRanges.reduce((acc, range) => ({
              // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
              ...acc,
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              [range.type]: (item as any)[range.type] || 0
            }), {}) : {})
        }));
      setItems(itemsComOrdem);
    });
  };

  const createMembers = useCreateManyEventMembers({
    mutation: {
      onError: (error) => {
        toast.error('Erro ao cadastrar membros', {
          description: error.response?.data.error,
        });
      },
      onSuccess: async () => {
        toast.success('Membros cadastrados com sucesso');
        await queryClient.invalidateQueries({
          queryKey: getEventMembersQueryKey(eventId),
        });
        setItems([]);
      },
    },
  });

  const handleCreate = () => {
    createMembers.mutate({
      eventId,
      data: items.map((item) => ({
        name: item.name,
        sessionName: item.session,
        register: String(item.register),
        visionId: String(item.VISION),
        order: item.order,
        ticketAllocations: !event?.autoGenerateTicketsTotalPerMember &&
          event?.ticketRanges &&
          event?.ticketRanges.length > 0 ?
          event.ticketRanges.map(range => ({
            eventTicketRangeId: range.id,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            quantity: (item as any)[range.type] || 0
          })) : [],
      })),
    });
  };

  const exportTemplate = () => {
    // Dados de exemplo para o template
    const templateData = [
      {
        VISION: '12345',
        name: 'João Silva',
        session: 'Escoteiro',
        register: '67890',
        ...(!event?.autoGenerateTicketsTotalPerMember &&
          event?.ticketRanges &&
          event?.ticketRanges.length > 0 ?
          event.ticketRanges.reduce((acc, range) => ({
            // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
            ...acc,
            [range.type]: 1
          }), {}) : {})
      }
    ];

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Membros');

    // Baixar arquivo
    XLSX.writeFile(wb, 'modelo_importacao_membros.xlsx');
  };

  return (
    <div className="px-8 pt-8">
      <h2 className="font-bold text-3xl tracking-tight">Membros</h2>
      <div className="flex justify-between gap-16">
        <div className="min-w-96">
          <Input
            accept=".xlsx"
            onChange={(e) => {
              if (!e.target.files) {
                return;
              }

              const file = e.target.files[0];
              readExcel(file);
            }}
            type="file"
          />
          <ul>
            <li>
              <span>Total de registros: </span> {items.length}
            </li>
            <li>
              <span>Total de registros sem visionId: </span>{' '}
              {items.filter((i) => !i.VISION).length}
            </li>
            <li>
              <span>Total de registros sem registro: </span>{' '}
              {items.filter((i) => !i.register).length}
            </li>
            <li>
              <span>Total de registros sem registro e visionId: </span>{' '}
              {items.filter((i) => !(i.register || i.VISION)).length}
            </li>
          </ul>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate}>Cadastrar membros</Button>
            <Button
              onClick={exportTemplate}
              variant="outline"
            >
              Baixar Modelo
            </Button>
          </div>

          {/* <ShowJson data={items} /> */}
        </div>

        <div className="flex-1">
          <DataTable columns={columns({
            extra: !event?.autoGenerateTicketsTotalPerMember &&
              event?.ticketRanges &&
              event?.ticketRanges.length > 0 ?
              event.ticketRanges.map(range => range.type) : []
          })} data={items} />
        </div>
      </div>
    </div>
  );
}
