'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { tdb } from '@/components/TableDataButton';

import type { Item } from '../.';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

type Props ={
  extra: string[]
}

export const columns = ({ extra }: Props): ColumnDef<Item>[] => [
  tdb('order', 'Ordem'),
  tdb('VISION', 'Vision'),
  tdb('name', 'Nome'),
  tdb('register', 'Registro'),
  tdb('session', 'Seção'),

  ...extra.map((e) => tdb(e, e)),
];
