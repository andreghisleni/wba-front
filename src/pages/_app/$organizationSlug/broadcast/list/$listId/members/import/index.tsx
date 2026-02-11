import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeftFromLineIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
// biome-ignore lint/performance/noNamespaceImport: XLSX library requires namespace import
import * as XLSX from 'xlsx';
import z from 'zod';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getBroadcastListMembersQueryKey,
  useGetBroadcastList,
  useImportMembersToBroadcastList,
} from '@/http/generated';
import { columns } from './-components/columns';

export type Item = {
  internal_name: string;
  phone: string;

  [key: string]: string;
};

export const Route = createFileRoute(
  '/_app/$organizationSlug/broadcast/list/$listId/members/import/'
)({
  component: RouteComponent,
  params: z.object({
    organizationSlug: z.string(),
    listId: z.string(),
  }),
});

function RouteComponent() {
  const { organizationSlug, listId } = Route.useParams();
  const { data: list } = useGetBroadcastList(listId);
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
        .filter((i) => i.internal_name && i.internal_name !== '#N/A') // 1. Filtra primeiro
        .map((item) => ({
          // 2. Depois adiciona a ordem
          ...item,
        }));
      setItems(itemsComOrdem);
    });
  };

  const importMembers = useImportMembersToBroadcastList({
    mutation: {
      onError: (error) => {
        toast.error('Erro ao importar membros', {
          description: error.response?.data.error,
        });
      },
      onSuccess: async () => {
        toast.success('Membros importados com sucesso');
        await queryClient.invalidateQueries({
          queryKey: getBroadcastListMembersQueryKey(listId),
        });
        setItems([]);
      },
    },
  });

  const handleCreate = () => {
    importMembers.mutate({
      listId,
      data: {
        members: items.map((item) => ({
          name: item.internal_name,
          phone: item.phone,
          additionalParams: Object.fromEntries(
            Object.entries(item).filter(
              ([key]) => key !== 'internal_name' && key !== 'phone'
            )
          ),
        })),
      },
    });
  };

  const exportTemplate = () => {
    // Dados de exemplo para o template
    const templateData = [
      {
        internal_name: 'João Silva',
        phone: '5511999999999',
        ...(list?.additionalParams?.reduce(
          (acc, addParam) => ({
            // biome-ignore lint/performance/noAccumulatingSpread: necessary here
            ...acc,
            [addParam]: '',
          }),
          {}
        ) || {}),
      },
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
      <div className='flex gap-4'>
        <Button asChild className="mb-4" variant="outline">
          <Link
            params={{
              organizationSlug,
              listId,
            }}
            to="/$organizationSlug/broadcast/list/$listId/members"
          >
            <ArrowLeftFromLineIcon />
          </Link>
        </Button>
        <h2 className="font-bold text-3xl tracking-tight">
          Importar membros para a lista de transmissão: {list?.name}
        </h2>
      </div>
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
          </ul>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate}>Cadastrar membros</Button>
            <Button onClick={exportTemplate} variant="outline">
              Baixar Modelo
            </Button>
          </div>

          {/* <ShowJson data={items} /> */}
        </div>

        <div className="flex-1">
          <DataTable
            columns={columns({
              additionalParams: list?.additionalParams || [],
            })}
            data={items}
          />
        </div>
      </div>
    </div>
  );
}
