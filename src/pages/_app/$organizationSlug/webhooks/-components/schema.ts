import { z } from 'zod';
import type { GetWebhooks200 } from '@/http/generated';

export const webhookSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres.'),
  url: z
    .string()
    .url('Insira uma URL válida (começando com http:// ou https://).'),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento.'),
  enabled: z.boolean(),
  secret: z
    .string()
    .optional()
    .refine((val) => val === undefined || val.length >= 8, {
      message: 'O segredo deve ter pelo menos 8 caracteres.',
    }),
});

export type WebhookSchema = z.infer<typeof webhookSchema>;

export const EVENT_OPTIONS = [
  { label: 'Mensagem Recebida', value: 'message.received' },
  { label: 'Mensagem Enviada', value: 'message.sent' },
  { label: 'Status de Entrega', value: 'message.status' },
];

export type Webhook = GetWebhooks200[0];
