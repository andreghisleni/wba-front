import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import { getAbsenceMessageQueryKey, useCreateOrUpdateAbsenceMessage } from '@/http/generated';
import { toast } from 'sonner';

interface AbsenceMessageFormProps {
  initialMessage?: string;
  setEditing?: (editing: boolean) => void;
}

export function AbsenceMessageForm({ initialMessage = '', setEditing }: AbsenceMessageFormProps) {
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { mutateAsync: saveAbsence, isPending: saving } = useCreateOrUpdateAbsenceMessage({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getAbsenceMessageQueryKey() });
        toast.success('Mensagem de ausência salva com sucesso.');
        if (setEditing) {
          setEditing(false);
        }
      },
      onError: (error) => {
        toast.error(`Erro ao salvar mensagem de ausência: ${error.message}`);
      },
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!message.trim()) {
      setError('Digite a mensagem de ausência.');
      return;
    }
    await saveAbsence({ data: { message } });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-white">
      <h2 className="font-bold text-lg mb-2">Cadastrar Mensagem de Ausência</h2>
      <Textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={4}
        placeholder="Digite a mensagem de ausência..."
        className="mb-2"
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <Button type="submit" disabled={saving || !message.trim()}>
        Salvar
      </Button>
    </form>
  );
}
