
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getAbsenceMessageQueryKey, useActivateAbsenceMessage } from '@/http/generated';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AbsenceMessageViewProps {
  message: string;
  active: boolean;
  setEditing?: (editing: boolean) => void;
}

export function AbsenceMessageView({ message, active, setEditing }: AbsenceMessageViewProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: activateAbsence, isPending: toggling } = useActivateAbsenceMessage({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getAbsenceMessageQueryKey() });
        toast.success(`Mensagem de ausência ${!active ? 'ativada' : 'desativada'} com sucesso.`);
      },
      onError: (error) => {
        toast.error(`Erro ao ${!active ? 'ativar' : 'desativar'} mensagem de ausência: ${error.message}`);
      }
    },
  });

  async function handleToggleActive() {
    await activateAbsence({ data: { active: !active } });
  }

  return (
    <div className="space-y-4 border rounded p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg">Mensagem de Ausência</h2>
          {setEditing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Editar mensagem
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={handleToggleActive} disabled={toggling} />
          <span className={active ? 'text-green-600' : 'text-gray-500'}>
            {active ? 'Ativada' : 'Desativada'}
          </span>
        </div>
      </div>
      <div className="border rounded p-3 bg-slate-50 text-gray-700 dark:bg-slate-800 dark:text-gray-300 whitespace-pre-line min-h-[60px]">
        {message}
      </div>
    </div>
  );
}
