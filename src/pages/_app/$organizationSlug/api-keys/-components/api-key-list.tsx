import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Copy,
  Key as KeyIcon,
  MoreVertical,
  Power,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type GetDashboardApiKeys200,
  getDashboardApiKeysQueryKey,
  useDeleteDashboardApiKey,
  useUpdateDashboardApiKeyStatus,
} from '@/http/generated';

interface ApiKeyListProps {
  data: GetDashboardApiKeys200; // Ajuste para o tipo gerado pelo Kubb se tiver (ex: ApiKeyListItem[])
  isLoading: boolean;
}

export function ApiKeyList({ data, isLoading }: ApiKeyListProps) {
  const queryClient = useQueryClient();
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const { mutateAsync: updateStatus } = useUpdateDashboardApiKeyStatus();
  const { mutateAsync: deleteKey } = useDeleteDashboardApiKey();

  // --- Handlers ---

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateStatus({ id, data: { enabled: !currentStatus } });
      // Atualiza a cache local sem refetch (Optimistic Update seria melhor, mas invalidate é seguro)
      await queryClient.invalidateQueries({
        queryKey: getDashboardApiKeysQueryKey(),
      });
      toast.success(currentStatus ? 'Chave desativada.' : 'Chave ativada.');
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDelete = async () => {
    if (!keyToDelete) {
      return;
    }
    try {
      await deleteKey({ id: keyToDelete });
      await queryClient.invalidateQueries({
        queryKey: getDashboardApiKeysQueryKey(),
      });
      toast.success('Chave removida.');
    } catch {
      toast.error('Erro ao remover chave.');
    } finally {
      setKeyToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Token (Máscara)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último Uso</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.length === 0 ? (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={6}
              >
                Nenhuma chave de API encontrada.
              </TableCell>
            </TableRow>
          ) : (
            data?.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <KeyIcon className="h-4 w-4 text-muted-foreground" />
                    {key.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {key.maskedKey}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      key.enabled ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                    }
                    variant={key.enabled ? 'default' : 'secondary'}
                  >
                    {key.enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(key.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="h-8 w-8 p-0" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleCopy(key.maskedKey)}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copiar Prefixo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(key.id, key.enabled)}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {key.enabled ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setKeyToDelete(key.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Revogar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Alert Dialog de Delete fica aqui para ser self-contained */}
      <AlertDialog
        onOpenChange={(open) => !open && setKeyToDelete(null)}
        open={!!keyToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Revogar Acesso?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O sistema que utiliza esta chave perderá
              o acesso imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Sim, revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
