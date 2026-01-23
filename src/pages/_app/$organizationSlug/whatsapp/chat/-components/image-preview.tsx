/** biome-ignore-all lint/a11y/useAltText: preview de imagem com label alternativo */
/** biome-ignore-all lint/performance/noImgElement: <explanation> */
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  isUploading: boolean;
  uploadProgress?: number;
  onRemove: () => void;
  onCaptionChange: (caption: string) => void;
  caption: string;
}

export function ImagePreview({
  file,
  previewUrl,
  isUploading,
  onRemove,
  onCaptionChange,
  caption,
}: ImagePreviewProps) {
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

  return (
    <div className="relative mb-3 overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-start gap-3 p-3">
        {/* Preview da imagem */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Preview da imagem selecionada"
            className="h-full w-full object-cover"
            src={previewUrl}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Info e legenda */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className='truncate font-medium text-sm'>{file.name}</p>
              <p className="text-muted-foreground text-xs">{fileSizeMB} MB</p>
            </div>
            <Button
              className="h-6 w-6 flex-shrink-0"
              disabled={isUploading}
              onClick={onRemove}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <input
            className="h-8 w-full rounded-md border bg-background px-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={isUploading}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Adicionar legenda (opcional)"
            type="text"
            value={caption}
          />
        </div>
      </div>
    </div>
  );
}
