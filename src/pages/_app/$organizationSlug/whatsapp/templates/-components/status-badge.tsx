import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

export function TemplateStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
          <CheckCircle2 size={12} /> Aprovado
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle size={12} /> Rejeitado
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
          <Clock size={12} /> Em Análise
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <AlertTriangle size={12} /> {status}
        </Badge>
      );
  }
}