import type { ColumnDef } from '@tanstack/react-table';
import { tdb } from '@/components/table/TableDataButton';
import type { GetBroadcastCampaigns200 } from '@/http/generated';

export type Campaign = GetBroadcastCampaigns200['data'][0];

export const columns = ({
  organizationSlug: _,
}: {
  organizationSlug: string;
}): ColumnDef<Campaign>[] => [
    tdb('name', 'Nome'),
    tdb('status', 'Status', 'capitalize'),
    tdb('template.name', 'Template'),
    tdb('totalContacts', 'Contatos'),
    tdb('sentCount', 'Enviadas'),
    tdb('failedCount', 'Falhas'),
    tdb('readCount', 'Lidas'),
    tdb('createdAt', 'Criada em', 'date-time'),
    tdb('updatedAt', 'Atualizada em', 'date-time'),
  ];
