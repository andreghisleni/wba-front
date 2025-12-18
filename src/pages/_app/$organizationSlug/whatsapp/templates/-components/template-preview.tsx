/** biome-ignore-all lint/performance/useTopLevelRegex: regex usado em função de highlight */
/** biome-ignore-all lint/performance/noImgElement: necessário para preview de imagem */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: componente de renderização */
import { Copy, ExternalLink, ImageIcon, Phone, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos baseados na estrutura retornada pela API
export type TemplateComponent = {
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

export type Template = {
  id: string;
  wamid?: string | null;
  name: string;
  category: string;
  body: string;
  status: string;
  structure: TemplateComponent[] | null;
  instanceId: string;
  createdAt: string | number;
  updatedAt: string | number;
  language: string;
};

export type TemplatePreviewProps = {
  template: Template;
  className?: string;
  compact?: boolean;
};

// Função para destacar variáveis no texto
function highlightVariables(text: string) {
  // Regex para encontrar {{1}}, {{2}}, etc.
  const parts = text.split(/(\{\{\d+\}\})/g);

  return parts.map((part, index) => {
    if (/\{\{\d+\}\}/.test(part)) {
      return (
        <span
          className="rounded bg-emerald-100 px-1 font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
          key={index.toString()}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

// Componente para renderizar o Header
function HeaderRenderer({
  component,
  compact,
}: {
  component: TemplateComponent;
  compact?: boolean;
}) {
  const format = component.format?.toUpperCase();

  if (format === 'VIDEO') {
    const headerHandle = component.example?.header_handle?.[0];

    if (headerHandle) {
      return (
        <div
          className={cn(
            'relative overflow-hidden rounded-t-lg bg-gray-900',
            compact ? 'h-24' : 'h-40'
          )}
        >
          <video
            className="h-full w-full"
            controls={!compact}
            muted
            playsInline
            poster=""
            preload="metadata"
            src={headerHandle}
          >
            <track kind="captions" />
          </video>
          {compact && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <PlayCircle className="h-8 w-8 text-white/90" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-t-lg bg-gray-800',
          compact ? 'h-24' : 'h-40'
        )}
      >
        <div className="flex flex-col items-center gap-2 text-white/80">
          <PlayCircle className={compact ? 'h-8 w-8' : 'h-12 w-12'} />
          {!compact && <span className="text-xs">Vídeo</span>}
        </div>
      </div>
    );
  }

  if (format === 'IMAGE') {
    const headerHandle = component.example?.header_handle?.[0];

    if (headerHandle) {
      return (
        <div
          className={cn(
            'overflow-hidden rounded-t-lg',
            compact ? 'h-24' : 'h-40'
          )}
        >
          <img
            alt="Header"
            className="h-full w-full object-cover"
            src={headerHandle}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-t-lg bg-gray-200 dark:bg-gray-700',
          compact ? 'h-24' : 'h-40'
        )}
      >
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
          <ImageIcon className={compact ? 'h-8 w-8' : 'h-12 w-12'} />
          {!compact && <span className="text-xs">Imagem</span>}
        </div>
      </div>
    );
  }

  if (format === 'DOCUMENT') {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-t-lg bg-blue-50 dark:bg-blue-900/20',
          compact ? 'h-16' : 'h-24'
        )}
      >
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <svg
            className={compact ? 'h-6 w-6' : 'h-8 w-8'}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <title>Documento</title>
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!compact && <span className="font-medium text-sm">Documento</span>}
        </div>
      </div>
    );
  }

  if (format === 'TEXT' && component.text) {
    return (
      <div className="px-3 pt-2 font-semibold text-gray-900 dark:text-gray-100">
        {highlightVariables(component.text)}
      </div>
    );
  }

  return null;
}

// Componente para renderizar o Body
function BodyRenderer({
  component,
  compact,
}: {
  component: TemplateComponent;
  compact?: boolean;
}) {
  if (!component.text) {
    return null;
  }

  return (
    <div
      className={cn(
        'whitespace-pre-wrap px-3 py-2 text-gray-800 dark:text-gray-200',
        compact ? 'line-clamp-4 text-xs' : 'text-sm'
      )}
    >
      {highlightVariables(component.text)}
    </div>
  );
}

// Componente para renderizar o Footer
function FooterRenderer({ component }: { component: TemplateComponent }) {
  if (!component.text) {
    return null;
  }

  return (
    <div className="px-3 pb-2 text-gray-500 text-xs dark:text-gray-400">
      {component.text}
    </div>
  );
}

// Componente para renderizar os Buttons
function ButtonsRenderer({
  component,
  compact,
}: {
  component: TemplateComponent;
  compact?: boolean;
}) {
  if (!component.buttons || component.buttons.length === 0) {
    return null;
  }

  return (
    <div className="border-gray-100 border-t dark:border-gray-700">
      {component.buttons.map((button, index) => {
        const isLast = index === (component.buttons?.length || 0) - 1;

        let icon: React.ReactNode = null;
        if (button.type === 'URL') {
          icon = <ExternalLink className="h-4 w-4" />;
        } else if (button.type === 'PHONE_NUMBER') {
          icon = <Phone className="h-4 w-4" />;
        } else if (button.type === 'COPY_CODE') {
          icon = <Copy className="h-4 w-4" />;
        }

        return (
          <div
            className={cn(
              'flex items-center justify-center gap-2 py-2 text-center font-medium text-blue-500 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-800',
              !isLast && 'border-gray-100 border-b dark:border-gray-700',
              compact ? 'text-xs' : 'text-sm'
            )}
            key={index.toString()}
          >
            {icon}
            <span>{button.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TemplatePreview({
  template,
  className,
  compact = false,
}: TemplatePreviewProps) {
  const structure = template.structure || [];

  // Encontrar cada tipo de componente
  const headerComponent = structure.find((c) => c.type === 'HEADER');
  const bodyComponent = structure.find((c) => c.type === 'BODY');
  const footerComponent = structure.find((c) => c.type === 'FOOTER');
  const buttonsComponent = structure.find((c) => c.type === 'BUTTONS');

  // Se não houver estrutura parseada, usar o body simples
  const hasStructure =
    headerComponent || bodyComponent || footerComponent || buttonsComponent;

  return (
    <div
      className={cn(
        'mx-auto overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-900',
        compact ? 'max-w-[280px]' : 'max-w-[340px]',
        className
      )}
    >
      {/* Balão do WhatsApp */}
      <div className="relative">
        {/* Cauda do balão */}
        <div className="-left-2 absolute top-0 h-4 w-4 overflow-hidden">
          <div className="h-4 w-4 origin-bottom-right rotate-45 transform bg-white dark:bg-gray-900" />
        </div>

        {/* Conteúdo */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
          {hasStructure ? (
            <>
              {headerComponent && (
                <HeaderRenderer compact={compact} component={headerComponent} />
              )}
              {bodyComponent && (
                <BodyRenderer compact={compact} component={bodyComponent} />
              )}
              {footerComponent && (
                <FooterRenderer component={footerComponent} />
              )}
              {buttonsComponent && (
                <ButtonsRenderer
                  compact={compact}
                  component={buttonsComponent}
                />
              )}
            </>
          ) : (
            // Fallback: usar o campo body simples
            <div
              className={cn(
                'whitespace-pre-wrap px-3 py-2 text-gray-800 dark:text-gray-200',
                compact ? 'line-clamp-4 text-xs' : 'text-sm'
              )}
            >
              {highlightVariables(template.body)}
            </div>
          )}

          {/* Timestamp fake */}
          <div className="flex justify-end px-3 pb-1">
            <span className="text-[10px] text-gray-400">
              {new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de dialog para visualizar o template - exportado separadamente
// para ser usado junto com os componentes de Dialog já importados na página
