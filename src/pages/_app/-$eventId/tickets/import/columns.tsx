'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Item } from './page'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: 'visionId',
    header: 'Vision',
    cell: ({ getValue, row }) => {
      const value = getValue<string>()
      return (
        <span className={row.original.error ? 'bg-red-600' : ''}>{value}</span>
      )
    },
    size: 12,
  },
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ getValue, row }) => {
      const value = getValue<string>()
      return (
        <span className={row.original.error ? 'bg-red-600' : ''}>{value}</span>
      )
    },
    size: 180,
  },

  {
    accessorKey: 'session',
    header: 'Seção',
    cell: ({ getValue, row }) => {
      const value = getValue<string>()
      return (
        <span className={row.original.error ? 'bg-red-600' : ''}>{value}</span>
      )
    },
  },
  {
    accessorKey: 'start',
    header: 'Inicio',
    cell: ({ getValue, row }) => {
      const value = getValue<number>()
      return (
        <span className={row.original.error ? 'bg-red-600' : ''}>{value}</span>
      )
    },
  },
  {
    accessorKey: 'end',
    header: 'Fim',
    cell: ({ getValue, row }) => {
      const value = getValue<number>()
      return (
        <span className={row.original.error ? 'bg-red-600' : ''}>{value}</span>
      )
    },
  },

  {
    accessorKey: 'error',
    header: 'Erros',
    cell: ({ getValue }) => {
      const value = getValue<string[] | null>()
      if (!value) {
        return null
      }
      return (
        <ul className="list-disc">
          {value.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )
    },
  },
]
