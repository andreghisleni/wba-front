import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetDashboardApiKeys } from '@/http/generated';
import { ApiKeyList } from './-components/api-key-list';
// Importando nossos componentes refatorados
import { CreateKeyDialog } from './-components/create-key-dialog';

export const Route = createFileRoute('/_app/$organizationSlug/api-keys/')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  // Busca inicial dos dados
  const { data, isLoading } = useGetDashboardApiKeys();

  // Estado para exibir o token recém-criado (só aparece uma vez)
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const copyCreatedKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      toast.success('Copiado!');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className='font-bold text-3xl tracking-tight'>Chaves de API</h2>
          <p className="text-muted-foreground">
            Gerencie tokens de acesso para integrações externas.
          </p>
        </div>

        {/* Componente do Formulário (RHF + Zod) */}
        <CreateKeyDialog onKeyCreated={setCreatedKey} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chaves Ativas</CardTitle>
          <CardDescription>
            Essas chaves têm acesso total para enviar mensagens em nome da sua
            organização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Componente da Lista (Actions + Delete) */}
          <ApiKeyList data={data || []} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* --- DIALOG DE SUCESSO (Token Reveal) --- */}
      {/* Mantido na page principal pois é um estado global da tela */}
      <Dialog
        onOpenChange={(open) => !open && setCreatedKey(null)}
        open={!!createdKey}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" /> Chave Criada!
            </DialogTitle>
            <DialogDescription>
              Copie sua chave de API agora.{' '}
              <strong className="text-destructive">
                Você não poderá vê-la novamente.
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4 flex items-center space-x-2'>
            <div className="grid flex-1 gap-2">
              <Label className="sr-only" htmlFor="link">
                Token
              </Label>
              <Input
                className='bg-muted font-mono text-muted-foreground'
                defaultValue={createdKey || ''}
                id="link"
                readOnly
              />
            </div>
            <Button className="px-3" onClick={copyCreatedKey} size="sm">
              <span className="sr-only">Copiar</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              onClick={() => setCreatedKey(null)}
              type="button"
              variant="secondary"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
