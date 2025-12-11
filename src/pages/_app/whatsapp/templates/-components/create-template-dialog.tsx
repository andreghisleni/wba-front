import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Link as LinkIcon, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { getWhatsappTemplatesQueryKey, useCreateWhatsappTemplates } from "@/http/generated";
import { useQueryClient } from "@tanstack/react-query";


// Schema alinhado com o Backend
const formSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9_]+$/, "Apenas letras minúsculas e underline"),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  bodyText: z.string().min(1, "Texto da mensagem é obrigatório"),
  footerText: z.string().optional(),
  // Arrays de strings simples
  bodyExamples: z.array(z.string().min(1, "Exemplo obrigatório")),
  buttonExamples: z.array(z.string().optional()),

  buttons: z.array(z.object({
    text: z.string().min(1, "Texto do botão obrigatório"),
    url: z.string().min(1, "URL obrigatória")
  })).max(2, "Máximo de 2 botões")
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", category: "MARKETING", bodyText: "", footerText: "",
      bodyExamples: [], buttonExamples: [], buttons: []
    }
  });

  const { fields: buttonFields, append, remove } = useFieldArray({
    control: form.control,
    name: "buttons"
  });

  // Mutação do TanStack Query
  const { mutateAsync: createTemplate, isPending } = useCreateWhatsappTemplates({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getWhatsappTemplatesQueryKey() });


        toast.success("Template enviado para análise!");
        setOpen(false);
        form.reset();
      },
      onError: (error) => {

        toast.error(error.response.body.error || "Erro ao criar template");
      }
    }
  });

  // 1. Detecta variáveis {{n}} no texto
  const bodyText = form.watch("bodyText");
  useEffect(() => {
    const matches = bodyText?.match(/{{\d+}}/g) || [];
    // Remove duplicatas e ordena: ['{{1}}', '{{2}}']
    const unique = Array.from(new Set(matches)).sort();
    setDetectedVars(unique);
  }, [bodyText]);

  // 2. Monitora variáveis nas URLs dos botões para pedir exemplo
  const watchedButtons = form.watch("buttons");

  const onSubmit = async (data: FormValues) => {
    // Filtra exemplos de botões (envia vazio se não tiver variável)
    const cleanButtonExamples = data.buttons?.map((btn, index) => {
      return btn.url.includes("{{1}}") ? data.buttonExamples[index] || "" : "";
    }).filter(ex => ex !== "") || []; // O backend espera array só se tiver example

    // Validação Extra: Botão com variável precisa de exemplo
    const missingBtnExample = data.buttons?.some((btn, idx) =>
      btn.url.includes("{{1}}") && !data.buttonExamples[idx]
    );
    if (missingBtnExample) {
      toast.error("Botões com variáveis precisam de um exemplo de URL completa.");
      return;
    }

    await createTemplate({
      data: {
        ...data,
        // Se não houver botões com variáveis, mandamos undefined para o array de exemplos
        buttonExamples: cleanButtonExamples.length > 0 ? cleanButtonExamples : undefined
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Novo Template</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Template</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">

            {/* Nome e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome (sem espaços)</FormLabel>
                  <FormControl><Input placeholder="promocao_semana" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utilidade</SelectItem>
                      <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            {/* Corpo */}
            <FormField control={form.control} name="bodyText" render={({ field }) => (
              <FormItem>
                <FormLabel>Mensagem</FormLabel>
                <FormControl>
                  <Textarea placeholder="Olá {{1}}, seu pedido {{2}} saiu para entrega." className="h-28" {...field} />
                </FormControl>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Info size={12} />
                  Use chaves duplas para variáveis. Ex: {'{{1}}'}, {'{{2}}'}.
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Exemplos Dinâmicos do Corpo */}
            {detectedVars.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-md border text-sm space-y-3">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <Info size={14} /> Exemplos das Variáveis (Obrigatório)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {detectedVars.map((v, idx) => (
                    <div key={v}>
                      <Label className="text-xs text-slate-500 mb-1 block">Exemplo para {v}</Label>
                      <Input
                        className="h-8 bg-white"
                        placeholder={v === '{{1}}' ? "Maria" : "123"}
                        {...form.register(`bodyExamples.${idx}`)} // Registra no array bodyExamples
                      />
                      {form.formState.errors.bodyExamples?.[idx] && (
                        <span className="text-[10px] text-red-500">Obrigatório</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <FormField control={form.control} name="footerText" render={({ field }) => (
              <FormItem>
                <FormLabel>Rodapé (Opcional)</FormLabel>
                <FormControl><Input placeholder="Ex: Minha Empresa" {...field} /></FormControl>
              </FormItem>
            )} />

            {/* Botões Dinâmicos */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-between items-center">
                <Label>Botões de Link (Máx 2)</Label>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => {
                    if (buttonFields.length < 2) append({ text: "", url: "" });
                    else toast.warning("Máximo de 2 botões permitidos.");
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>

              {buttonFields.map((field, index) => {
                // Verifica se a URL atual digitada tem variável
                const currentUrl = watchedButtons[index]?.url || "";
                const hasVar = currentUrl.includes("{{1}}");

                return (
                  <div key={field.id} className="p-3 border rounded-md bg-slate-50 space-y-3 relative group">
                    <Button
                      variant="ghost" size="icon" type="button"
                      className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Texto do Botão</Label>
                        <Input className="bg-white h-8" placeholder="Ver Pedido" {...form.register(`buttons.${index}.text`)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">URL</Label>
                        <div className="relative">
                          <LinkIcon className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                          <Input className="pl-7 bg-white h-8" placeholder="https://site.com/{{1}}" {...form.register(`buttons.${index}.url`)} />
                        </div>
                      </div>
                    </div>

                    {/* Exemplo de URL (Condicional) */}
                    {hasVar && (
                      <div className="bg-blue-50 p-2 rounded border border-blue-100">
                        <Label className="text-xs font-semibold text-blue-700 mb-1 block">
                          URL Completa de Exemplo (Obrigatório)
                        </Label>
                        <Input
                          className="bg-white border-blue-200 h-8 text-blue-800"
                          placeholder="https://site.com/pedido/12345"
                          {...form.register(`buttonExamples.${index}`)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
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