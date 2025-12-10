import type { ColumnDef } from "@tanstack/react-table";
import { tdbs } from "@/components/TableDataButton-server";
import { tdbNew } from "@/components/table/TableDataButton";
import { Badge } from "@/components/ui/badge";
import type { GetEquipments200 } from "@/http/generated";
import { EquipmentForm } from "./equipment-form";

export type Equipment = GetEquipments200["data"][0];

export const columns: ColumnDef<Equipment>[] = [
  tdbs("name", "Equipamento"),
  tdbNew({
    name: "category.name",
    label: "Categoria",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.category?.name}</Badge>
    ),
    s: true,
  }),
  tdbNew({
    name: "purchasePrice",
    label: "Custo",
    dataType: "currency",
    s: true,
  }),
  tdbNew({
    name: "rentalPrice",
    label: "Locação",
    dataType: "currency",
    s: true,
  }),
  tdbNew({
    name: "stockQuantity",
    label: "Estoque",
    s: true,
  }),
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
      <div className="flex justify-end">
        <EquipmentForm data={row.original} />
      </div>
    ),
  },
];
