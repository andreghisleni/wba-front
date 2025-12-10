import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  getEventMemberByIdQueryKey,
  getEventTicketsQueryKey,
  useAssignTicket,
  useGetEventTickets,
} from '@/http/generated';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export function AttachTicketToMemberDialog({
  eventId,
  memberId,
}: {
  eventId: string;
  memberId: string;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const queryClient = useQueryClient();

  // carregar a página atual de tickets
  const { data, isFetching, refetch } = useGetEventTickets(eventId, {
    'p.page': page,
    'p.pageSize': pageSize,
    'f.filter': filter.length > 0 ? filter : undefined,
    'f.noMemberId': true,
  });

  const tickets = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const assignTicket = useAssignTicket({
    mutation: {
      onSuccess: async () => {
        toast.success('Ingresso vinculado ao membro com sucesso');
        // invalidar membro e tickets
        await queryClient.invalidateQueries({
          queryKey: getEventMemberByIdQueryKey(eventId, memberId),
        });
        await queryClient.invalidateQueries({
          queryKey: getEventTicketsQueryKey(eventId),
        });
        setOpen(false);
        setSelectedTicketId(null);
        setPage(1);
      },
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      onError: (err: any) => {
        toast.error(
          `Erro ao vincular ingresso: ${err?.message ?? String(err)}`
        );
      },
    },
  });

  function handleOpen() {
    setOpen(true);
    setPage(1);
    setSelectedTicketId(null);
    // refetch para garantir dados
    refetch();
  }

  async function handleAttach() {
    if (!selectedTicketId) {
      toast.error('Selecione um ingresso antes de vincular');
      return;
    }
    await assignTicket.mutateAsync({
      eventId,
      ticketId: selectedTicketId,
      data: {
        memberId
      },
    });
  }

  const canLoadMore = page < (totalPages || 1);

  // combine pages already loaded if user has navigated pages >1
  // here we only display current page, but we can keep an accumulated list if needed
  // for simplicity show accumulated pages by refetching pages 1..page
  const accumulatedTickets = useMemo(() => tickets, [tickets]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button onClick={handleOpen} variant="outline">
          Vincular Ingresso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="space-y-4">
          <h3 className='font-medium text-lg'>Vincular ingresso ao membro</h3>

          <div>
            <Input
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por número, nome, telefone..."
              value={filter}
            />
          </div>

          <div className='max-h-80 space-y-2 overflow-auto'>
            {isFetching &&
              (!accumulatedTickets || accumulatedTickets.length === 0) ? (
              <div className="py-4">Carregando...</div>
            ) : accumulatedTickets.length === 0 ? (
              <div className='py-4 text-muted-foreground text-sm'>
                Nenhum ingresso encontrado
              </div>
            ) : (
              <RadioGroup
                onValueChange={(v) => setSelectedTicketId(v || null)}
                value={selectedTicketId ?? undefined}
              >
                {accumulatedTickets.map((t) => (
                  <Card className="mb-2" key={t.id}>
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <div className='text-muted-foreground text-sm'>
                          Nº {t.number}
                        </div>
                        <div className="font-medium">
                          {t.member?.name ?? t.name ?? 'Sem nome'}
                        </div>
                        <div className='text-muted-foreground text-sm'>
                          {t.phone ?? ''}
                        </div>
                      </div>
                      <RadioGroupItem value={t.id} />
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                disabled={!canLoadMore || isFetching}
                onClick={() => {
                  if (!canLoadMore) {
                    return;
                  }
                  setPage((p) => p + 1);
                }}
                variant="ghost"
              >
                {isFetching
                  ? 'Carregando...'
                  : canLoadMore
                    ? 'Carregar mais'
                    : 'Sem mais páginas'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                disabled={!selectedTicketId || assignTicket.isPending}
                onClick={handleAttach}
              >
                {assignTicket.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Vincular'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
