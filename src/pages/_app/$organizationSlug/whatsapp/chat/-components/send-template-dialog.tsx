/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { Info, Link as LinkIcon, Loader2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Hooks gerados (ajuste os imports)
import {
  useGetWhatsappTemplates,
  usePostWhatsappMessages,
} from '@/http/generated/hooks';

interface SendTemplateDialogProps {
  contactId: string;
  disabled?: boolean;
}

export function SendTemplateDialog({
  contactId,
  disabled,
}: SendTemplateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  // Estados para armazenar os valores digitados
  const [bodyParams, setBodyParams] = useState<string[]>([]); // ["João", "R$ 50"]
  const [buttonParams, setButtonParams] = useState<Record<number, string>>({}); // { 0: "xyz" } para botão index 0

  // 1. Busca templates (apenas APPROVED)
  const { data: templatesResponse } = useGetWhatsappTemplates();
  // Filtra apenas aprovados para não dar erro na hora de enviar
  const approvedTemplates =
    templatesResponse?.filter((t) => t.status === 'APPROVED') || [];

  const selectedTemplate = approvedTemplates.find(
    (t) => t.id === selectedTemplateId
  );

  // 2. Hook de Envio de Mensagem
  const { mutateAsync: sendMessage, isPending } = usePostWhatsappMessages();

  // 3. Efeito: Quando seleciona um template, detecta quantas variáveis ele tem
  useEffect(() => {
    if (selectedTemplate) {
      // Regex para achar {{1}}, {{2}}...
      const matches = selectedTemplate.body.match(/{{\d+}}/g) || [];
      const count = new Set(matches).size;
      // Cria array vazio do tamanho necessário
      setBodyParams(new Array(count).fill(''));
      setButtonParams({});
    } else {
      setBodyParams([]);
    }
  }, [selectedTemplate]);

  const handleSend = async () => {
    console.log(
      'Enviando template:',
      selectedTemplate,
      bodyParams,
      buttonParams
    );
    if (!selectedTemplate) {
      toast.error('Selecione um template.');
      return;
    }

    // Verifica se preencheu tudo
    if (bodyParams.some((p) => !p.trim())) {
      toast.error('Preencha todas as variáveis do texto.');
      return;
    }

    // Prepara array de botões
    const formattedButtons = Object.entries(buttonParams).map(
      ([index, value]) => ({
        index: Number(index),
        value,
      })
    );

    try {
      await sendMessage({
        data: {
          contactId,
          type: 'template',
          template: {
            name: selectedTemplate.name,
            language: selectedTemplate.language,
            bodyValues: bodyParams,
            buttonValues: formattedButtons,
          },
        },
      });

      toast.success('Template enviado com sucesso!');
      setIsOpen(false);
      // Reset
      setSelectedTemplateId(null);
      setBodyParams([]);
      setButtonParams({});
    } catch {
      toast.error('Erro ao enviar template.');
    }
  };

  // Função auxiliar para ver se o botão tem URL dinâmica
  // Precisamos olhar a estrutura JSON que salvamos (structure)
  const renderButtonInputs = () => {
    if (!selectedTemplate?.structure) {
      return null;
    }

    // Faz o cast seguro pois structure vem como any/json do banco
    const components = Array.isArray(selectedTemplate.structure)
      ? selectedTemplate.structure
      : [];

    const buttonsComp = components.find((c: any) => c.type === 'BUTTONS');
    if (!buttonsComp?.buttons) {
      return null;
    }

    return buttonsComp.buttons.map((btn: any, idx: number) => {
      if (btn.type === 'URL' && btn.url?.includes('{{1}}')) {
        return (
          <div className='mt-2 space-y-1' key={idx.toString()}>
            <Label className='flex items-center gap-1 text-blue-600 text-xs'>
              <LinkIcon size={10} /> Variável do Botão "{btn.text}"
            </Label>
            <div className="flex items-center gap-2">
              <span className='max-w-[100px] truncate text-[10px] text-muted-foreground'>
                {btn.url.split('{{1}}')[0]}
              </span>
              <Input
                className="h-8 flex-1"
                onChange={(e) =>
                  setButtonParams((prev) => ({
                    ...prev,
                    [idx]: e.target.value,
                  }))
                }
                placeholder="ex: 12345"
                value={buttonParams[idx] || ''}
              />
            </div>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className={disabled ? 'w-full' : ''}
          size={disabled ? 'default' : 'icon'}
          variant={disabled ? 'default' : 'secondary'}
        >
          {disabled ? (
            'Iniciar Nova Conversa (Template)'
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de Template */}
          <div className="space-y-2">
            <Label>Escolha um modelo</Label>
            <Select onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {approvedTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="space-y-4 pr-2">
              {/* Preview do Texto (com inputs no meio seria complexo, vamos listar inputs abaixo) */}
              <div className='whitespace-pre-wrap rounded-md bg-muted p-3 text-muted-foreground text-sm'>
                {selectedTemplate.body}
              </div>

              {/* Inputs do Corpo */}
              {bodyParams.length > 0 && (
                <div className="space-y-3 border-t pt-3">
                  <h4 className='flex items-center gap-2 font-medium text-sm'>
                    <Info size={14} /> Preencha as variáveis
                  </h4>
                  {bodyParams.map((val, idx) => (
                    <div className="grid gap-1" key={idx.toString()}>
                      <Label className="text-xs">
                        Variável {`{{${idx + 1}}}`}
                      </Label>
                      <Input
                        onChange={(e) => {
                          const newParams = [...bodyParams];
                          newParams[idx] = e.target.value;
                          setBodyParams(newParams);
                        }}
                        placeholder={`Valor para {{${idx + 1}}}`}
                        value={val}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Inputs dos Botões */}
              {renderButtonInputs()}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleSend}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Mensagem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
