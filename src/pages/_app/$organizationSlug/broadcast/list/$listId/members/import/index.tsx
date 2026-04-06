/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
/** biome-ignore-all lint/complexity/noForEach: <explanation> */
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
    // 1. Sanitização dos dados vindos do Excel
    const sanitizedMembers = items.map((item) => {
      // Garante que o nome seja sempre uma string e remove espaços sobrando
      const nameStr = String(item.internal_name || '').trim();

      // Garante que o telefone seja string. (Opcional: você poderia usar .replace(/\D/g, '') para tirar traços e parênteses)
      const phoneStr = String(item.phone || '').trim();

      return {
        name: nameStr,
        phone: phoneStr,
        additionalParams: Object.fromEntries(
          Object.entries(item).filter(
            ([key]) => key !== 'internal_name' && key !== 'phone'
          )
        ),
      };
    });

    // 2. (OPCIONAL) Debug com Zod: Descobre quem está quebrando a regra!
    // Usando o schema que criamos na resposta anterior
    const importMemberSchema = z.object({
      name: z.string().min(5, "Nome muito curto (< 5)"),
      phone: z.string().min(10, "Telefone muito curto (< 10)"),
      additionalParams: z.any().optional(),
    });

    const payloadSchema = z.object({ members: z.array(importMemberSchema) });
    const check = payloadSchema.safeParse({ members: sanitizedMembers });

    if (!check.success) {
      // Se cair aqui, abra o F12 (Console) no navegador! Ele vai te dizer a linha exata do erro.
      console.error("🚨 O Excel possui dados inválidos que o Backend vai rejeitar:");
      check.error.issues.forEach(issue => {
        const rowIndex = issue.path[1]; // Pega o índice do array
        const field = issue.path[2];    // Pega o campo (name ou phone)

        // Mostra qual linha do Excel (aproximadamente) está com problema
        console.error(
          `Linha ${Number(rowIndex) + 2} | Campo '${field}': ${issue.message} -> Valor lido:`,
          sanitizedMembers[Number(rowIndex)]
        );
      });

      toast.error("Alguns contatos estão inválidos. Verifique o console (F12) para ver os detalhes.");
      return; // Para a execução e não envia pro backend!
    }

    // 3. Se tudo estiver perfeito, envia a requisição!
    importMembers.mutate({
      listId,
      data: {
        members: sanitizedMembers,
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
