import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { tdbs } from "@/components/TableDataButton-server";
import { tdbNew } from "@/components/table/TableDataButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GetBudgets200 } from "@/http/generated";
import { CloneBudgetDialog } from "./clone-budget-dialog";
import { CreateBudgetDialog } from "./create-budget-dialog";

const statusMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export type Budget = GetBudgets200["data"][0];

export const columns: ColumnDef<Budget>[] = [
  tdbs("clientName", "Cliente"),
  tdbNew({
    name: "eventDate",
    label: "Data do Evento",
    dataType: "date-time",
    s: true,
  }),
  tdbNew({
    name: "status",
    label: "Status",
    s: true,
    cell: ({ row }) => {
      const status = row.original.status || "DRAFT";
      return <Badge variant={statusMap[status] || "outline"}>{status}</Badge>;
    },
  }),
  tdbNew({
    name: "finalValue",
    label: "Valor Total",
    dataType: "currency",
    s: true,
  }),
  tdbNew({
    name: "createdAt",
    label: "Criado em",
    dataType: "date-time",
    s: true,
  }),
  tdbNew({
    name: "user.name",
    label: "Criado por",
    s: true,
  }),
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button asChild size="icon" variant="outline">
          <Link
            params={{ budgetId: row.original.id }}
            to={"/rental/budgets/$budgetId"}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <CreateBudgetDialog budget={row.original} />
        <CloneBudgetDialog
          originalClientName={row.original.clientName}
          originalId={row.original.id}
        />
      </div>
    ),
  },
];
