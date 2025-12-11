import { useState } from "react";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Hook gerado pelo Kubb (ajuste o import)
import { getWhatsappContactsQueryKey, useCreateWhatsappContact } from "@/http/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";

interface NewChatDialogProps {
  onContactCreated: (contactId: string) => void;
}

export function NewChatDialog({ onContactCreated }: NewChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const { mutateAsync: createContact, isPending } = useCreateWhatsappContact({
    mutation: {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: getWhatsappContactsQueryKey() });
        // Sucesso tratado na função handleCreate

        // O backend retorna o objeto contato. Pegamos o ID.
        // Dependendo do gerador (Eden/Kubb), pode ser result.data.id ou result.id
        const newContactId = data.id || data.data?.id;

        toast.success("Contato criado!");
        setIsOpen(false);
        setPhoneNumber("");
        setName("");

        // Callback para a página pai selecionar esse contato imediatamente
        if (newContactId) {
          onContactCreated(newContactId);
        }

      },
      onError: (error) => {
        console.error(error);
        toast.error("Erro ao criar contato.");
      }
    }
  });

  const handleCreate = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Digite um número válido.");
      return;
    }

    // Cria o contato
    await createContact({
      data: {
        phoneNumber: "55" + phoneNumber.replace(/\D/g, ""), // Força 55 ou deixe o usuario digitar
        name: name
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Nova Conversa">
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
            <div className="flex items-center border rounded-md px-3">
              <span className="text-sm text-muted-foreground mr-1">+55</span>
              <Input
                className="border-0 p-0 h-9 focus-visible:ring-0"
                placeholder="49 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome do Contato</Label>
            <Input
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Contato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}