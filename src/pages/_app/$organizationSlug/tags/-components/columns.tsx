import type { ColumnDef } from '@tanstack/react-table';
import { tdbNew } from '@/components/table/TableDataButton';
import type { GetTags200 } from '@/http/generated';
import { cssColors } from './colors';
import { TagForm } from './tag-form';

export type Tag = GetTags200['data'][0];

export const columns = (): ColumnDef<Tag>[] => [
  tdbNew({
    name: "name",
    label: "Nome",
    dataType: "capitalize",
    s: true,
  }),
  tdbNew({
    name: "priority",
    label: "Prioridade",
    s: true,
  }),
  tdbNew({
    name: "colorName", label: "Cor", cell: ({ row }) => {
      const colorName = row.original.colorName;
      const cssClass = cssColors[colorName as keyof typeof cssColors] || 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100';

      return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 font-medium text-xs ${cssClass}`}>
          {colorName}
        </span>
      );
    },
  }),
  tdbNew({
    name: "createdAt",
    label: "Criado em",
    dataType: "date-time",
    s: true,
  }),

  {
    id: "actions",
    header: () => <span>Ações</span>,
    cell: ({ row }) => {
      return (
        <TagForm tag={row.original} />
      );
    },
  },
];
