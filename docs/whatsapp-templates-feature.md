# WhatsApp Templates - Funcionalidades Implementadas

> Documentação das melhorias implementadas na tela de Templates de Mensagem do WhatsApp.

## 📋 Visão Geral

Foram implementadas melhorias no formulário de criação de templates e na visualização dos templates existentes, incluindo um componente de preview que imita o visual de um balão de mensagem do WhatsApp.

---

## A. Formulário de Criação de Templates

**Arquivo:** `src/pages/_app/$organizationSlug/whatsapp/templates/-components/create-template-dialog.tsx`

### Seletor de Cabeçalho (Header)

Novo campo `headerType` adicionado ao formulário com as seguintes opções:

| Tipo       | Ícone     | Descrição                                    |
| ---------- | --------- | -------------------------------------------- |
| `NONE`     | Ban       | Sem cabeçalho                                |
| `TEXT`     | Type      | Cabeçalho de texto (com suporte a variáveis) |
| `IMAGE`    | ImageIcon | Cabeçalho com imagem                         |
| `VIDEO`    | VideoIcon | Cabeçalho com vídeo                          |
| `DOCUMENT` | FileText  | Cabeçalho com documento                      |

### Inputs Condicionais

#### Header de Texto (`TEXT`)
- Input para texto do cabeçalho
- Suporte a variáveis (`{{1}}`, `{{2}}`, etc.)
- Detecção automática de variáveis com campos de exemplo obrigatórios
- Estilização em azul para diferenciar dos exemplos do body

#### Header de Mídia (`IMAGE`, `VIDEO`, `DOCUMENT`)
- Exibe um aviso informativo em amarelo:
  > "A mídia real será enviada no momento do disparo. Aqui estamos apenas definindo que este template aceita mídia como cabeçalho."

### Importação via Paste (JSON)

A funcionalidade de colar JSON foi atualizada para reconhecer e importar o campo `HEADER`:

```json
{
  "type": "HEADER",
  "format": "VIDEO",
  "example": {
    "header_handle": ["https://..."]
  }
}
```

### Schema do Formulário

```typescript
const formSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9_]+$/),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  headerType: z.enum(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).default('NONE'),
  headerText: z.string().optional(),
  headerExamples: z.array(z.string()).optional(),
  bodyText: z.string().min(1),
  footerText: z.string().optional(),
  bodyExamples: z.array(z.string()),
  buttons: z.array(...).max(2),
});
```

---

## B. Componente de Preview

**Arquivo:** `src/pages/_app/$organizationSlug/whatsapp/templates/-components/template-preview.tsx`

### Descrição

Componente que renderiza um preview visual do template imitando um balão de mensagem do WhatsApp.

### Props

```typescript
type TemplatePreviewProps = {
  template: Template;
  className?: string;
  compact?: boolean; // Modo compacto para uso em cards
};
```

### Renderização por Tipo de Componente

#### HEADER

| Format     | Com URL de Exemplo                        | Sem URL de Exemplo                      |
| ---------- | ----------------------------------------- | --------------------------------------- |
| `VIDEO`    | Player de vídeo real com controles        | Placeholder escuro com ícone Play       |
| `IMAGE`    | Imagem carregada da URL                   | Placeholder cinza com ícone de imagem   |
| `DOCUMENT` | Placeholder azul com ícone de documento   | Placeholder azul com ícone de documento |
| `TEXT`     | Texto em negrito com variáveis destacadas | -                                       |

#### BODY

- Texto com quebras de linha preservadas
- Variáveis (`{{1}}`, `{{2}}`) destacadas em verde (emerald)
- Modo compacto: limite de 4 linhas com `line-clamp`

#### FOOTER

- Texto pequeno em cinza
- Posicionado abaixo do body

#### BUTTONS

- Botões estilizados em azul
- Ícones baseados no tipo:
  - `URL` → ExternalLink
  - `PHONE_NUMBER` → Phone
  - `COPY_CODE` → Copy
- Separados por bordas

#### Timestamp

- Hora atual no canto inferior direito
- Formato: `HH:mm`

### Exemplo de Uso

```tsx
import { TemplatePreview } from './-components/template-preview';

<TemplatePreview template={template} />
<TemplatePreview template={template} compact />
```

---

## C. Tela de Listagem de Templates

**Arquivo:** `src/pages/_app/$organizationSlug/whatsapp/templates/index.tsx`

### Botão de Visualização

Cada card de template agora possui um botão "Ver" (ícone de olho) no footer que abre um Dialog com:

1. **Background estilizado** - Padrão similar ao WhatsApp
2. **TemplatePreview** - Preview em tamanho real
3. **Informações adicionais**:
   - Categoria
   - Idioma
   - Status
   - Data de atualização
4. **ShowJson** - Dados brutos do template

### Estrutura do Dialog

```tsx
<Dialog>
  <DialogTrigger>
    <Button size="sm" variant="ghost">
      <Eye /> Ver
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Preview: {template.name}</DialogTitle>
    </DialogHeader>
    
    {/* Background WhatsApp */}
    <div style={{ backgroundColor: '#e5ddd5', backgroundImage: '...' }}>
      <TemplatePreview template={template} />
    </div>
    
    {/* Info Grid */}
    <div className="grid grid-cols-2 gap-2">
      <div>Categoria: {category}</div>
      <div>Idioma: {language}</div>
      <div>Status: {status}</div>
      <div>Atualizado: {date}</div>
    </div>
  </DialogContent>
</Dialog>
```

---

## 📁 Arquivos Modificados/Criados

| Arquivo                                                                                      | Ação         |
| -------------------------------------------------------------------------------------------- | ------------ |
| `src/pages/_app/$organizationSlug/whatsapp/templates/-components/template-preview.tsx`       | ✅ Criado     |
| `src/pages/_app/$organizationSlug/whatsapp/templates/-components/create-template-dialog.tsx` | ✏️ Modificado |
| `src/pages/_app/$organizationSlug/whatsapp/templates/index.tsx`                              | ✏️ Modificado |
| `src/pages/_app/$organizationSlug/whatsapp/chat/-components/template-message-bubble.tsx`     | ✅ Criado     |
| `src/pages/_app/$organizationSlug/whatsapp/chat/-components/message-bubble.tsx`              | ✏️ Modificado |

---

## D. Renderização de Templates no Chat

**Arquivo:** `src/pages/_app/$organizationSlug/whatsapp/chat/-components/template-message-bubble.tsx`

### Descrição

Componente que renderiza mensagens de template enviadas no chat com formatação completa, mostrando:
- Header (vídeo, imagem, documento ou texto)
- Body com variáveis substituídas pelos valores reais
- Footer
- Botões estilizados

### Como Funciona

1. Quando uma mensagem é do tipo `template`, o `MessageBubble` delega para o `TemplateMessageBubble`
2. O componente busca o template pelo `templateId` ou `templateName` salvo em `templateParams`
3. Substitui as variáveis `{{1}}`, `{{2}}` pelos valores salvos em `bodyParams`
4. Renderiza a estrutura completa do template

### Estrutura de `templateParams` (salvo no backend)

```typescript
{
  templateId: string;        // ID do template no banco
  templateName: string;      // Nome do template
  language: string;          // Idioma (ex: "pt_BR")
  headerParams?: {           // Parâmetros do header (se TEXT)
    type: string;
    values?: string[];
  };
  bodyParams?: string[];     // Valores das variáveis do body
  buttonParams?: {           // Valores das variáveis de botões
    index: number;
    value: string;
  }[];
}
```

### Fallback

Se o template não for encontrado ou não tiver estrutura, exibe o texto simples:
```
📋 Template: nome_do_template
```

---

## 🎨 Estilização

### Cores das Variáveis
- Background: `bg-emerald-100` / `dark:bg-emerald-900/50`
- Texto: `text-emerald-700` / `dark:text-emerald-300`

### Aviso de Mídia (Header)
- Border: `border-amber-200` / `dark:border-amber-900`
- Background: `bg-amber-50` / `dark:bg-amber-950/20`
- Texto: `text-amber-800` / `dark:text-amber-200`

### Exemplos do Header (Texto)
- Border: `border-blue-200` / `dark:border-blue-900`
- Background: `bg-blue-50/50` / `dark:bg-blue-950/20`
- Texto: `text-blue-700` / `dark:text-blue-300`

---

## 📅 Data de Implementação

18 de dezembro de 2025
