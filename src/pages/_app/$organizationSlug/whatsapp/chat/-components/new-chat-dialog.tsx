/** biome-ignore-all lint/style/useTemplate: <explanation> */
/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Hook gerado pelo Kubb (ajuste o import)
import {
  getWhatsappContactsQueryKey,
  useCreateWhatsappContact,
} from '@/http/generated/hooks';

interface NewChatDialogProps {
  onContactCreated: (contactId: string) => void;
}

export function NewChatDialog({ onContactCreated }: NewChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const { mutateAsync: createContact, isPending } = useCreateWhatsappContact({
    mutation: {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: getWhatsappContactsQueryKey(),
        });
        // Sucesso tratado na função handleCreate

        // O backend retorna o objeto contato. Pegamos o ID.
        // Dependendo do gerador (Eden/Kubb), pode ser result.data.id ou result.id
        const newContactId = data.id || data.data?.id;

        toast.success('Contato criado!');
        setIsOpen(false);
        setPhoneNumber('');
        setName('');

        // Callback para a página pai selecionar esse contato imediatamente
        if (newContactId) {
          onContactCreated(newContactId);
        }
      },
      onError: (error) => {
        console.error(error);
        toast.error('Erro ao criar contato.');
      },
    },
  });

  const handleCreate = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Digite um número válido.');
      return;
    }

    // Cria o contato
    await createContact({
      data: {
        phoneNumber: '55' + phoneNumber.replace(/\D/g, ''), // Força 55 ou deixe o usuario digitar
        name,
      },
    });
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="icon" title="Nova Conversa" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Nova Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Telefone (DDD + Número)</Label>
            <div className='flex items-center rounded-md border px-3'>
              <span className='mr-1 text-muted-foreground text-sm'>+55</span>
              <Input
                autoFocus
                className='h-9 border-0 p-0 focus-visible:ring-0'
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="49 99999-9999"
                value={phoneNumber}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome do Contato</Label>
            <Input
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João da Silva"
              value={name}
            />
          </div>

          <Button
            className="w-full"
            disabled={isPending}
            onClick={handleCreate}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Contato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
