import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TemplateStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge
          className='gap-1 border-green-200 bg-green-50 text-green-700'
          variant="outline"
        >
          <CheckCircle2 size={12} /> Aprovado
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge className="gap-1" variant="destructive">
          <XCircle size={12} /> Rejeitado
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge
          className='gap-1 border-yellow-200 bg-yellow-50 text-yellow-700'
          variant="outline"
        >
          <Clock size={12} /> Em Análise
        </Badge>
      );
    default:
      return (
        <Badge className="gap-1" variant="outline">
          <AlertTriangle size={12} /> {status}
        </Badge>
      );
  }
}
