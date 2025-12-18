/** biome-ignore-all lint/a11y/useMediaCaption: vídeo tem controles */
/** biome-ignore-all lint/style/noNonNullAssertion: narrowing validado antes */
/** biome-ignore-all lint/performance/noImgElement: necessário para preview */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: componente de renderização complexo */
import {
  Copy,
  ExternalLink,
  FileText,
  ImageIcon,
  Phone,
  PlayCircle,
} from 'lucide-react';
import { useGetWhatsappTemplates } from '@/http/generated/hooks';
import { cn } from '@/lib/utils';
import { MessageStatus } from './message-status';

// Tipos para os parâmetros do template salvos na mensagem
type TemplateParams = {
  templateId: string;
  templateName: string;
  language: string;
  headerParams?: {
    type: string;
    values?: string[];
  };
  bodyParams?: string[];
  buttonParams?: {
    index: number;
    value: string;
  }[];
};

// Tipo para o componente do template
type TemplateComponent = {
  type: string;
  format?: string;
  text?: string;
  example?: {
    body_text?: string[][];
    header_text?: string[];
    header_handle?: string[];
  };
  buttons?: {
    type: string;
    text: string;
    url?: string;
    example?: string[];
  }[];
};

type TemplateMessageBubbleProps = {
  message: {
    id: string;
    body: string | null;
    type: string;
    direction: string;
    status: string;
    timestamp: string | Date;
    templateParams?: TemplateParams | null;
    errorDesc?: string | null;
  };
};

// Função para substituir variáveis no texto
function replaceVariables(text: string, values: string[]): string {
  let result = text;
  for (const [index, value] of values.entries()) {
    result = result.replace(`{{${index + 1}}}`, value);
  }
  return result;
}

// Subcomponente para vídeo
function VideoHeader({ headerHandle }: { headerHandle?: string }) {
  if (headerHandle) {
    return (
      <div className="relative mb-2 overflow-hidden rounded-lg bg-gray-900">
        <video
          className="h-32 w-full object-cover"
          controls
          muted
          playsInline
          preload="metadata"
          src={headerHandle}
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }

  return (
    <div className="mb-2 flex h-32 items-center justify-center rounded-lg bg-gray-800">
      <div className="flex flex-col items-center gap-1 text-white/80">
        <PlayCircle className="h-10 w-10" />
        <span className="text-xs">Vídeo</span>
      </div>
    </div>
  );
}

// Subcomponente para imagem
function ImageHeader({
  headerHandle,
  isMe,
}: {
  headerHandle?: string;
  isMe: boolean;
}) {
  if (headerHandle) {
    return (
      <div className="mb-2 overflow-hidden rounded-lg">
        <img
          alt="Header"
          className="h-32 w-full object-cover"
          src={headerHandle}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-2 flex h-32 items-center justify-center rounded-lg',
        isMe ? 'bg-green-700/50' : 'bg-gray-200 dark:bg-gray-700'
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center gap-1',
          isMe ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
        )}
      >
        <ImageIcon className="h-10 w-10" />
        <span className="text-xs">Imagem</span>
      </div>
    </div>
  );
}

// Subcomponente para documento
function DocumentHeader({ isMe }: { isMe: boolean }) {
  return (
    <div
      className={cn(
        'mb-2 flex h-20 items-center justify-center gap-2 rounded-lg',
        isMe ? 'bg-green-700/50' : 'bg-blue-50 dark:bg-blue-900/20'
      )}
    >
      <FileText
        className={cn(
          'h-8 w-8',
          isMe ? 'text-white' : 'text-blue-600 dark:text-blue-400'
        )}
      />
      <span
        className={cn(
          'font-medium text-sm',
          isMe ? 'text-white' : 'text-blue-600 dark:text-blue-400'
        )}
      >
        Documento
      </span>
    </div>
  );
}

// Componente para renderizar o Header
function HeaderRenderer({
  component,
  headerParams,
  isMe,
}: {
  component: TemplateComponent;
  headerParams?: TemplateParams['headerParams'];
  isMe: boolean;
}) {
  const format = component.format?.toUpperCase();
  const headerHandle = component.example?.header_handle?.[0];

  if (format === 'VIDEO') {
    return <VideoHeader headerHandle={headerHandle} />;
  }

  if (format === 'IMAGE') {
    return <ImageHeader headerHandle={headerHandle} isMe={isMe} />;
  }

  if (format === 'DOCUMENT') {
    return <DocumentHeader isMe={isMe} />;
  }

  if (format === 'TEXT' && component.text) {
    const headerText = headerParams?.values?.length
      ? replaceVariables(component.text, headerParams.values)
      : component.text;

    return <div className="mb-1 font-semibold">{headerText}</div>;
  }

  return null;
}

// Função para obter ícone do botão
function getButtonIcon(buttonType: string): React.ReactNode {
  if (buttonType === 'URL') {
    return <ExternalLink className="h-3 w-3" />;
  }
  if (buttonType === 'PHONE_NUMBER') {
    return <Phone className="h-3 w-3" />;
  }
  if (buttonType === 'COPY_CODE') {
    return <Copy className="h-3 w-3" />;
  }
  return null;
}

// Função para substituir variável na URL do botão
function replaceUrlVariable(url: string, paramValue?: string): string {
  if (!paramValue) {
    return url;
  }
  // A URL do template usa {{1}} como placeholder
  return url.replace(/\{\{1\}\}/g, paramValue);
}

// Componente para renderizar um único botão
function TemplateButton({
  button,
  index,
  isLast,
  isMe,
  buttonParam,
}: {
  button: NonNullable<TemplateComponent['buttons']>[number];
  index: number;
  isLast: boolean;
  isMe: boolean;
  buttonParam?: string;
}) {
  const icon = getButtonIcon(button.type);
  const borderClass = isMe
    ? 'border-b border-green-500/30'
    : 'border-b border-gray-200 dark:border-gray-600';

  const baseClassName = cn(
    'flex items-center justify-center gap-1 py-1.5 text-center font-medium transition-opacity',
    !isLast && borderClass,
    isMe
      ? 'text-white/90 hover:text-white'
      : 'text-blue-500 dark:text-blue-400'
  );

  // Se for botão de URL, renderiza como link clicável
  if (button.type === 'URL' && button.url) {
    // Substitui a variável {{1}} na URL pelo valor do parâmetro
    const finalUrl = replaceUrlVariable(button.url, buttonParam);
    return (
      <a
        className={cn(baseClassName, 'cursor-pointer hover:opacity-80')}
        href={finalUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        {icon}
        <span className="text-xs">{button.text}</span>
      </a>
    );
  }

  // Se for botão de telefone, renderiza como link tel:
  if (button.type === 'PHONE_NUMBER' && button.url) {
    return (
      <a
        className={cn(baseClassName, 'cursor-pointer hover:opacity-80')}
        href={`tel:${button.url}`}
      >
        {icon}
        <span className="text-xs">{button.text}</span>
      </a>
    );
  }

  // Outros tipos de botão (QUICK_REPLY, COPY_CODE, etc.)
  return (
    <div className={baseClassName} key={index.toString()}>
      {icon}
      <span className="text-xs">{button.text}</span>
    </div>
  );
}

// Componente para renderizar os Buttons
function ButtonsRenderer({
  component,
  buttonParams,
  isMe,
}: {
  component: TemplateComponent;
  buttonParams?: TemplateParams['buttonParams'];
  isMe: boolean;
}) {
  const buttons = component.buttons;
  if (!buttons || buttons.length === 0) {
    return null;
  }

  // Cria um mapa de índice -> valor para fácil acesso
  const paramsMap = new Map(
    buttonParams?.map((p) => [p.index, p.value]) ?? []
  );

  return (
    <div
      className={cn(
        'mt-2 border-t pt-2',
        isMe ? 'border-green-500/30' : 'border-gray-200 dark:border-gray-600'
      )}
    >
      {buttons.map((button, index) => (
        <TemplateButton
          button={button}
          buttonParam={paramsMap.get(index)}
          index={index}
          isLast={index === buttons.length - 1}
          isMe={isMe}
          key={index.toString()}
        />
      ))}
    </div>
  );
}

// Componente de fallback quando template não é encontrado
function FallbackBubble({
  message,
  isMe,
  templateParams,
}: {
  message: TemplateMessageBubbleProps['message'];
  isMe: boolean;
  templateParams?: TemplateParams | null;
}) {
  return (
    <div
      className={`mb-4 flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={cn(
          'relative min-w-48 max-w-[80%] rounded-lg p-3 shadow-sm md:max-w-[60%]',
          isMe
            ? 'rounded-tr-none bg-green-600 text-white dark:bg-green-700 dark:text-gray-100'
            : 'rounded-tl-none border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">
          {message.body ||
            `📋 Template: ${templateParams?.templateName || 'Desconhecido'}`}
        </p>
        <div className="mt-1 flex select-none items-center justify-end gap-1">
          <span className="pt-0.5 text-[10px] leading-none opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <MessageStatus
            errorDesc={message.errorDesc ?? undefined}
            isUser={isMe}
            status={message.status}
          />
        </div>
      </div>
    </div>
  );
}

export function TemplateMessageBubble({ message }: TemplateMessageBubbleProps) {
  const isMe = message.direction === 'OUTBOUND';
  const templateParams = message.templateParams;

  // Busca os templates para encontrar a estrutura
  const { data: templates } = useGetWhatsappTemplates();

  // Encontra o template correspondente
  const template = templates?.find(
    (t) =>
      t.id === templateParams?.templateId ||
      (t.name === templateParams?.templateName &&
        t.language === templateParams?.language)
  );

  // Se não encontrar o template ou não tiver estrutura, renderiza fallback
  const hasValidTemplate = template?.structure && templateParams;
  if (!hasValidTemplate) {
    return (
      <FallbackBubble
        isMe={isMe}
        message={message}
        templateParams={templateParams}
      />
    );
  }

  // Encontra os componentes do template
  // Após o check acima, sabemos que structure existe
  const structure = template.structure!;
  const headerComponent = structure.find((c) => c.type === 'HEADER');
  const bodyComponent = structure.find((c) => c.type === 'BODY');
  const footerComponent = structure.find((c) => c.type === 'FOOTER');
  const buttonsComponent = structure.find((c) => c.type === 'BUTTONS');

  // Substitui variáveis no body
  let bodyText = bodyComponent?.text || template.body;
  if (templateParams.bodyParams?.length) {
    bodyText = replaceVariables(bodyText, templateParams.bodyParams);
  }

  return (
    <div
      className={`mb-4 flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={cn(
          'relative min-w-48 max-w-[80%] overflow-hidden rounded-lg shadow-sm md:max-w-[60%]',
          isMe
            ? 'rounded-tr-none bg-green-600 text-white dark:bg-green-700 dark:text-gray-100'
            : 'rounded-tl-none border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
        )}
      >
        <div className="p-3">
          {/* Header */}
          {headerComponent && (
            <HeaderRenderer
              component={headerComponent}
              headerParams={templateParams.headerParams}
              isMe={isMe}
            />
          )}

          {/* Body */}
          <p className="whitespace-pre-wrap text-sm">{bodyText}</p>

          {/* Footer */}
          {footerComponent?.text && (
            <p
              className={cn(
                'mt-1 text-xs',
                isMe ? 'opacity-70' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {footerComponent.text}
            </p>
          )}
        </div>

        {/* Buttons */}
        {buttonsComponent && (
          <div className="px-3 pb-2">
            <ButtonsRenderer
              buttonParams={templateParams.buttonParams}
              component={buttonsComponent}
              isMe={isMe}
            />
          </div>
        )}

        {/* Timestamp e Status */}
        <div className="flex select-none items-center justify-end gap-1 px-3 pb-2">
          <span className="pt-0.5 text-[10px] leading-none opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <MessageStatus
            errorDesc={message.errorDesc ?? undefined}
            isUser={isMe}
            status={message.status}
          />
        </div>
      </div>
    </div>
  );
}
