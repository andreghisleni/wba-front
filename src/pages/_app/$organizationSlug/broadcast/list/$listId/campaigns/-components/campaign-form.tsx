/** biome-ignore-all lint/suspicious/noConsole: show errors */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { generateFormFieldsFromZodSchema } from '@/components/generate-form-fields-from-zod-schema';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getBroadcastCampaignsQueryKey,
  useCreateBroadcastCampaign,
  useGetBroadcastList,
  useGetWhatsappTemplates,
} from '@/http/generated';

const paramSchema = z.object({
  type: z.enum(['body', 'button']).describe('Tipo'),
  source: z.enum(['fixed', 'member']).describe('Source'),
  value: z.string().optional().describe('Valor fixo'),
  key: z.string().optional().describe('Chave variável'),
  index: z.number().optional().describe('Índice do botão'),
  variableIndex: z.number().describe('Índice da variável'),
  label: z.string().describe('Label da variável'),
});

const campaignSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Informe um nome para a campanha')
      .describe('Nome da campanha'),
    templateId: z.string().min(1, 'Selecione um template').describe('Template'),
    params: z.array(paramSchema).optional(),
  })
  .describe('Campanha');

const baseFieldsSchema = campaignSchema.omit({ params: true });

// Função para extrair variáveis do template
function extractTemplateVariables(template: any) {
  const bodyVariables: Array<{ type: 'body'; index: number; label: string }> =
    [];
  const buttonVariables: Array<{
    type: 'button';
    index: number;
    label: string;
    buttonIndex: number;
  }> = [];

  // Extrai variáveis do body
  const bodyText = template.body || '';
  const bodyMatches = bodyText.matchAll(/\{\{(\d+)\}\}/g);
  for (const match of bodyMatches) {
    const index = Number.parseInt(match[1], 10);
    bodyVariables.push({
      type: 'body',
      index,
      label: `Corpo do Texto {{${index}}}`,
    });
  }

  // Extrai variáveis dos botões
  const buttons =
    template.structure?.find((s: any) => s.type === 'BUTTONS')?.buttons || [];
  buttons.forEach((button: any, btnIdx: number) => {
    if (button.type === 'URL' && button.url) {
      const urlMatches = button.url.matchAll(/\{\{(\d+)\}\}/g);
      for (const match of urlMatches) {
        const index = Number.parseInt(match[1], 10);
        buttonVariables.push({
          type: 'button',
          index,
          label: `Botão "${button.text}" {{${index}}}`,
          buttonIndex: btnIdx,
        });
      }
    }
  });

  return { bodyVariables, buttonVariables };
}

export function CampaignForm({ listId }: { listId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: list } = useGetBroadcastList(listId);
  const queryClient = useQueryClient();
  const { data: templates, isLoading: isLoadingTemplates } =
    useGetWhatsappTemplates();

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      templateId: '',
      params: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'params',
  });

  const templateOptions = useMemo(
    () => ({
      templateId: {
        values: templates?.map((template) => ({
          value: template.id,
          label: `${template.name} (${template.language})`,
        })),
        loading: isLoadingTemplates,
      },
    }),
    [templates, isLoadingTemplates]
  );

  const templateId = form.watch('templateId');

  const selectedTemplate = useMemo(
    () => templates?.find((template) => template.id === templateId),
    [templates, templateId]
  );

  // Extrai variáveis do template e atualiza os campos do formulário
  const templateVariables = useMemo(() => {
    if (!selectedTemplate) {
      return { bodyVariables: [], buttonVariables: [] };
    }
    return extractTemplateVariables(selectedTemplate);
  }, [selectedTemplate]);

  // Atualiza os campos quando o template muda
  useEffect(() => {
    if (selectedTemplate) {
      const { bodyVariables, buttonVariables } = templateVariables;
      const allVariables = [
        ...bodyVariables.map((v) => ({
          type: 'body' as const,
          source: 'member' as const,
          value: '',
          key: '',
          index: 0,
          variableIndex: v.index,
          label: v.label,
        })),
        ...buttonVariables.map((v) => ({
          type: 'button' as const,
          source: 'member' as const,
          value: '',
          key: '',
          index: v.buttonIndex,
          variableIndex: v.index,
          label: v.label,
        })),
      ];
      replace(allVariables);
    }
  }, [selectedTemplate, templateVariables, replace]);

  const additionalParamsOptions = useMemo(() => {
    if (!list?.additionalParams) {
      return [];
    }
    return list.additionalParams.map((param) => ({
      value: param,
      label: param,
    }));
  }, [list]);

  const createCampaign = useCreateBroadcastCampaign({
    mutation: {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: getBroadcastCampaignsQueryKey(listId),
        });
        form.reset({ name: '', templateId: '', params: [] });
        setIsOpen(false);
        toast.success('Campanha criada com sucesso');
      },
      onError(error) {
        toast.error('Erro ao criar campanha', {
          description: error.response?.data?.error || error.message,
        });
      },
    },
  });

  async function onSubmit(values: z.infer<typeof campaignSchema>) {
    const bodyParams = values.params
      ?.filter((p) => p.type === 'body')
      .map((p) => ({
        source: p.source,
        ...(p.source === 'fixed' ? { value: p.value } : { key: p.key }),
      }));

    const buttonParams = values.params
      ?.filter((p) => p.type === 'button')
      .map((p) => ({
        index: p.index || 0,
        source: p.source,
        ...(p.source === 'fixed' ? { value: p.value } : { key: p.key }),
      }));

    const templateParams =
      bodyParams?.length || buttonParams?.length
        ? {
          ...(bodyParams?.length ? { bodyParams } : {}),
          ...(buttonParams?.length ? { buttonParams } : {}),
        }
        : undefined;

    await createCampaign.mutateAsync({
      data: {
        name: values.name,
        templateId: values.templateId,
        ...(templateParams ? { templateParams } : {}),
      },
      listId,
    });
  }

  return (
    <Dialog
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Nova campanha</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar campanha</DialogTitle>
          <DialogDescription>
            Crie uma campanha de transmissão para esta lista.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {generateFormFieldsFromZodSchema(
              baseFieldsSchema,
              form as never,
              templateOptions
            )}

            {selectedTemplate && (
              <div className="rounded-md border border-dashed p-3 text-muted-foreground text-sm">
                <p className="font-medium text-foreground">
                  Preview do Conteúdo
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {selectedTemplate.body}
                </p>
                {selectedTemplate.structure?.[0]?.example?.body_text && (
                  <p className="mt-2 text-xs">
                    Exemplo de variáveis:{' '}
                    {selectedTemplate.structure[0].example.body_text
                      .map((v) => v.join(', '))
                      .join(' | ')}
                  </p>
                )}
              </div>
            )}

            {fields.length > 0 && (
              <div className="space-y-4">
                <div className="font-medium text-sm">Mapeamento de Dados</div>

                {/* Variáveis do Texto */}
                {fields.some((f) => f.type === 'body') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <span>📝</span>
                      <span className="font-medium">Variáveis do Texto</span>
                    </div>
                    {fields.map(
                      (field, index) =>
                        field.type === 'body' && (
                          <div
                            className="grid grid-cols-12 items-end gap-2 rounded-lg border bg-muted/30 p-3"
                            key={field.id}
                          >
                            <div className="col-span-4">
                              <FormLabel className="text-xs">
                                {field.label}
                              </FormLabel>
                            </div>

                            <div className="col-span-4">
                              <FormField
                                control={form.control}
                                name={`params.${index}.source`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="member">
                                          🔗 Variável do Sistema
                                        </SelectItem>
                                        <SelectItem value="fixed">
                                          ✏️ Texto/Link Fixo
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-4">
                              {form.watch(`params.${index}.source`) ===
                                'member' ? (
                                <FormField
                                  control={form.control}
                                  name={`params.${index}.key`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Selecione..." />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {additionalParamsOptions.map(
                                            (opt) => (
                                              <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <FormField
                                  control={form.control}
                                  name={`params.${index}.value`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          className="h-9"
                                          placeholder="Digite o valor..."
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                )}

                {/* Variáveis de Link (Botões) */}
                {fields.some((f) => f.type === 'button') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <span>🔗</span>
                      <span className="font-medium">
                        Variáveis de Link (Botões)
                      </span>
                    </div>
                    {fields.map(
                      (field, index) =>
                        field.type === 'button' && (
                          <div
                            className="grid grid-cols-12 items-end gap-2 rounded-lg border bg-muted/30 p-3"
                            key={field.id}
                          >
                            <div className="col-span-4">
                              <FormLabel className="text-xs">
                                {field.label}
                              </FormLabel>
                            </div>

                            <div className="col-span-4">
                              <FormField
                                control={form.control}
                                name={`params.${index}.source`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="member">
                                          🔗 Variável do Sistema
                                        </SelectItem>
                                        <SelectItem value="fixed">
                                          ✏️ Texto/Link Fixo
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-4">
                              {form.watch(`params.${index}.source`) ===
                                'member' ? (
                                <FormField
                                  control={form.control}
                                  name={`params.${index}.key`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Selecione..." />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {additionalParamsOptions.map(
                                            (opt) => (
                                              <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <FormField
                                  control={form.control}
                                  name={`params.${index}.value`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          className="h-9"
                                          placeholder="Digite o valor..."
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Cadastrar'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
