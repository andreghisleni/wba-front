/** biome-ignore-all lint/nursery/noNoninteractiveElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { tdb } from '@/components/table/TableDataButton';
import { Button } from '@/components/ui/button';
import type { GetBroadcastLists200 } from '@/http/generated';
import { ListForm } from './list-form';

export type List = GetBroadcastLists200[0];

export const columns = ({ organizationSlug }: { organizationSlug: string }): ColumnDef<List>[] => [
  tdb('name', 'Nome'),
  tdb('description', 'Descrição'),
  tdb('additionalParams', 'Parâmetros Adicionais', 'array'),
  tdb('totalMembers', 'Total de Membros'),
  tdb('totalCampaigns', 'Total de Campanhas'),
  tdb('createdAt', 'Criado em', 'date-time'),
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      return (
        <div className="flex gap-2" onDoubleClick={e => e.stopPropagation()}>
          <ListForm list={row.original} />
          <Button asChild size="sm" variant="outline">
            <Link
              params={{ listId: row.original.id, organizationSlug }}
              to="/$organizationSlug/broadcast/list/$listId/members"
            >
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    },
  },
];
