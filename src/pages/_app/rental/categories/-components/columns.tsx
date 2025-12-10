/** biome-ignore-all lint/nursery/noNoninteractiveElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import type { ColumnDef } from "@tanstack/react-table";
import { tdbs } from "@/components/TableDataButton-server";
import { tdb, tdbNew } from "@/components/table/TableDataButton";
import { Badge } from "@/components/ui/badge";
import type { GetCategories200 } from "@/http/generated";
import { CategoryForm } from "./category-form";

export type Category = GetCategories200["data"][0];

export const columns: ColumnDef<Category>[] = [
  tdbs("name", "Nome"),
  // {
  //   accessorKey: 'rentalPercent',
  //   header: tdbs('rentalPercent', 'Locação (%)').header,
  //   cell: ({ row }) => <Badge variant="outline">{row.original.rentalPercent}%</Badge>,
  // },
  tdbNew({
    name: "rentalPercent",
    label: "Locação (%)",
    s: true,
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.rentalPercent}%</Badge>
    ),
  }),
  tdb("description", "Descrição"),
  tdbNew({
    name: "createdAt",
    label: "Criado em",
    s: true,
    dataType: "date-time",
  }),
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => (
      <div
        className="flex justify-end"
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <CategoryForm data={row.original} />
      </div>
    ),
  },
];
