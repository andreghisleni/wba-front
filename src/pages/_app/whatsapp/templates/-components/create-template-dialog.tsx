/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  ClipboardPaste,
  Info,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { type ClipboardEvent, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  getWhatsappTemplatesQueryKey,
  useCreateWhatsappTemplates,
} from '@/http/generated';

// Schema (Mantido igual)
const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas e underline'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  bodyText: z.string().min(1, 'Texto da mensagem é obrigatório'),
  footerText: z.string().optional(),
  bodyExamples: z.array(z.string().min(1, 'Exemplo obrigatório')),
  buttons: z
    .array(
      z.object({
        text: z.string().min(1, 'Texto do botão obrigatório'),
        url: z.string().min(1, 'URL obrigatória'),
        example: z.string().optional(),
      })
    )
    .max(2, 'Máximo de 2 botões')
    .refine(
      (buttons) => {
        return buttons.every((btn) => {
          if (btn.url.includes('{{1}}')) {
            return !!btn.example && btn.example.length > 0;
          }
          return true;
        });
      },
      {
        message: 'Botões com variáveis precisam de um exemplo de URL completa.',
        path: ['root'],
      }
    ),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'MARKETING',
      bodyText: '',
      footerText: '',
      bodyExamples: [],
      buttons: [],
    },
  });

  const {
    fields: buttonFields,
    append,
    remove,
    replace,
  } = useFieldArray({
    control: form.control,
    name: 'buttons',
  });

  const { mutateAsync: createTemplate, isPending } = useCreateWhatsappTemplates(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getWhatsappTemplatesQueryKey(),
          });
          toast.success('Template enviado para análise!');
          setOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(
            (error as any).response?.body?.error || 'Erro ao criar template'
          );
        },
      },
    }
  );

  const bodyText = form.watch('bodyText');

  useEffect(() => {
    const matches = bodyText?.match(/{{\d+}}/g) || [];
    const unique = Array.from(new Set(matches)).sort();
    setDetectedVars(unique);
  }, [bodyText]);

  const watchedButtons = form.watch('buttons');

  // --- LÓGICA DE IMPORTAÇÃO (PASTE) ---
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  const handlePaste = (e: ClipboardEvent<HTMLFormElement>) => {
    try {
      const clipboardText = e.clipboardData.getData('text');
      if (
        !(
          clipboardText.trim().startsWith('{') ||
          clipboardText.trim().startsWith('[')
        )
      ) {
        return;
      }

      const parsed = JSON.parse(clipboardText);
      // Suporta colar um objeto único ou um array (pega o primeiro item)
      const data = Array.isArray(parsed) ? parsed[0] : parsed;

      // Validação básica se é um template do WhatsApp
      if (!(data.components && Array.isArray(data.components))) {
        return;
      }

      e.preventDefault(); // Impede a colagem padrão se for um JSON válido

      // 1. Mapear Nome e Categoria
      // Sanitiza nome: minúsculo e underscore
      const cleanName = (data.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
      form.setValue('name', cleanName);

      if (['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(data.category)) {
        form.setValue('category', data.category);
      }

      // 2. Mapear Componentes
      const bodyComponent = data.components.find((c: any) => c.type === 'BODY');
      const footerComponent = data.components.find(
        (c: any) => c.type === 'FOOTER'
      );
      const buttonsComponent = data.components.find(
        (c: any) => c.type === 'BUTTONS'
      );

      if (bodyComponent) {
        form.setValue('bodyText', bodyComponent.text || '');

        // Extrair exemplos do corpo
        // Estrutura do exemplo: { body_text: [["exemplo1", "exemplo2"]] }
        const examples = bodyComponent.example?.body_text?.[0] || [];
        form.setValue('bodyExamples', examples);
      }

      if (footerComponent) {
        form.setValue('footerText', footerComponent.text || '');
      }

      // 3. Mapear Botões
      if (buttonsComponent && Array.isArray(buttonsComponent.buttons)) {
        const newButtons = buttonsComponent.buttons
          .filter((btn: any) => btn.type === 'URL') // Só suportamos botões de URL por enquanto
          .map((btn: any) => ({
            text: btn.text || '',
            url: btn.url || '',
            // Exemplo vem como array ["https://..."], pegamos o primeiro
            example: btn.example?.[0] || '',
          }));

        // Substitui os botões atuais pelos importados
        replace(newButtons);
      } else {
        replace([]);
      }

      toast.success('Template importado com sucesso!');
    } catch {
      // Se não for JSON, deixa o evento seguir normalmente (colar texto comum)
      // console.error(err);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const cleanButtonExamples = data.buttons
      .map((btn) => (btn.url.includes('{{1}}') ? btn.example || '' : ''))
      .filter((ex) => ex !== '');

    const payload = {
      name: data.name,
      category: data.category,
      bodyText: data.bodyText,
      footerText: data.footerText,
      bodyExamples: data.bodyExamples,
      buttons: data.buttons.map(({ text, url }) => ({ text, url })),
      buttonExamples:
        cleanButtonExamples.length > 0 ? cleanButtonExamples : undefined,
    };

    await createTemplate({ data: payload });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Criar Novo Template</span>
            <span className="flex items-center gap-1 font-normal text-muted-foreground text-xs">
              <ClipboardPaste className="h-3 w-3" />
              Cole um JSON para preencher
            </span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4 py-2"
            onPaste={handlePaste}
            onSubmit={form.handleSubmit(onSubmit)} // Listener mágico aqui
          >
            {/* Nome e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome (sem espaços)</FormLabel>
                    <FormControl>
                      <Input placeholder="promocao_semana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange} // Mudado de defaultValue para value para reagir ao setValue
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="UTILITY">Utilidade</SelectItem>
                        <SelectItem value="AUTHENTICATION">
                          Autenticação
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* Corpo */}
            <FormField
              control={form.control}
              name="bodyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <Textarea
                      className="h-28 resize-none"
                      placeholder="Olá {{1}}, seu pedido {{2}} saiu para entrega."
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Info size={12} />
                    Use chaves duplas para variáveis. Ex: {'{{1}}'}, {'{{2}}'}.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exemplos Dinâmicos do Corpo */}
            {detectedVars.length > 0 && (
              <div className="space-y-3 rounded-md border p-3 text-sm">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Info size={14} /> Exemplos das Variáveis (Obrigatório)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {detectedVars.map((v, idx) => (
                    <div key={v}>
                      <Label className="mb-1 block text-slate-500 text-xs">
                        Exemplo para {v}
                      </Label>
                      <Input
                        className="h-8 "
                        placeholder={v === '{{1}}' ? 'Maria' : '123'}
                        {...form.register(`bodyExamples.${idx}`)}
                      />
                      {form.formState.errors.bodyExamples?.[idx] && (
                        <span className="text-[10px] text-red-500">
                          Obrigatório
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <FormField
              control={form.control}
              name="footerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rodapé (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Minha Empresa" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Botões Dinâmicos */}
            <div className="space-y-3 border-t pt-2">
              <div className="flex items-center justify-between">
                <Label>Botões de Link (Máx 2)</Label>
                <Button
                  onClick={() => {
                    if (buttonFields.length < 2) {
                      append({ text: '', url: '', example: '' });
                    } else {
                      toast.warning('Máximo de 2 botões permitidos.');
                    }
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="mr-1 h-3 w-3" /> Adicionar
                </Button>
              </div>

              {form.formState.errors.buttons?.root && (
                <div className="font-medium text-red-500 text-xs">
                  {form.formState.errors.buttons.root.message}
                </div>
              )}

              {buttonFields.map((field, index) => {
                const currentUrl = watchedButtons[index]?.url || '';
                const hasVar = currentUrl.includes('{{1}}');

                return (
                  <div
                    className="group relative space-y-3 rounded-md border p-3 transition-colors "
                    key={field.id}
                  >
                    <Button
                      className="absolute top-1 right-1 h-6 w-6 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      onClick={() => remove(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`buttons.${index}.text`}
                        render={({ field: fi }) => (
                          <FormItem className="space-y-1">
                            <Label className="text-xs">Texto do Botão</Label>
                            <FormControl>
                              <Input
                                className="h-8"
                                placeholder="Ver Pedido"
                                {...fi}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`buttons.${index}.url`}
                        render={({ field: fi }) => (
                          <FormItem className="space-y-1">
                            <Label className="text-xs">URL</Label>
                            <div className="relative">
                              <LinkIcon className="absolute top-2.5 left-2 h-3 w-3 text-muted-foreground" />
                              <FormControl>
                                <Input
                                  className="h-8 pl-7"
                                  placeholder="https://site.com/{{1}}"
                                  {...fi}
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Exemplo de URL */}
                    {hasVar && (
                      <div className="rounded border border-blue-100 p-2">
                        <Label className="mb-1 block font-semibold text-blue-700 text-xs">
                          URL Completa de Exemplo (Obrigatório)
                        </Label>
                        <Input
                          className='h-8 border-blue-200 text-blue-800'
                          placeholder="https://site.com/pedido/12345"
                          {...form.register(`buttons.${index}.example`)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button disabled={isPending} type="submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Template
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
