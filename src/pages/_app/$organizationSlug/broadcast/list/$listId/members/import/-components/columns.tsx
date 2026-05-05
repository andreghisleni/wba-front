'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { tdb } from '@/components/table/TableDataButton';
import type { Item } from '../.';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

type Props = {
  additionalParams?: string[];
};

export const columns = ({ additionalParams }: Props): ColumnDef<Item>[] => [
  tdb('internal_name', 'Nome'),
  tdb('phone', 'Telefone', 'phone'),

  ...(additionalParams ? additionalParams.map((e) => tdb(e, e)) : []),
];
