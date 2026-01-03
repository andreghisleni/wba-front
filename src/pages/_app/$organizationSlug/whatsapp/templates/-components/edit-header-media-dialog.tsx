import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Video } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getWhatsappTemplatesQueryKey,
  useUpdateWhatsappTemplateMedia,
} from '@/http/generated';
import type { Template, TemplateComponent } from './template-preview';

type EditHeaderMediaDialogProps = {
  template: Template;
};

export function EditHeaderMediaDialog({ template }: EditHeaderMediaDialogProps) {
  const [open, setOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(template.headerMediaUrl || '');
  const queryClient = useQueryClient();

  const { mutateAsync: updateMedia, isPending } = useUpdateWhatsappTemplateMedia({
    mutation: {
      onSuccess: async () => {
        toast.success('URL da mídia atualizada com sucesso!');
        await queryClient.invalidateQueries({
          queryKey: getWhatsappTemplatesQueryKey(),
        });
        setOpen(false);
      },
      onError: (error) => {
        toast.error(`Erro ao atualizar: ${error.message}`);
      },
    },
  });

  // Verifica se o template tem header de vídeo
  const structure = template.structure || [];
  const headerComponent = structure.find(
    (c: TemplateComponent) => c.type === 'HEADER' && c.format === 'VIDEO'
  );

  // Se não tem header de vídeo, não renderiza nada
  if (!headerComponent) {
    return null;
  }



  const handleSave = async () => {
    await updateMedia({
      id: template.id,
      data: {
        headerMediaUrl: mediaUrl || null,
      },
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-7 gap-1 px-2" size="sm" variant="outline">
          <Video className="h-3.5 w-3.5" />
          <span className="text-xs">Mídia</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Editar Mídia do Header
          </DialogTitle>
          <DialogDescription>
            Configure a URL do vídeo que será enviado no header do template "{template.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo de URL */}
          <div className="space-y-2">
            <Label htmlFor="mediaUrl">URL do Vídeo</Label>
            <Input
              id="mediaUrl"
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://exemplo.com/video.mp4"
              type="url"
              value={mediaUrl}
            />
            <p className="text-muted-foreground text-xs">
              Use uma URL pública acessível (ex: Cloudflare R2, S3, etc.)
            </p>
          </div>

          {/* Preview do vídeo */}
          {mediaUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="overflow-hidden rounded-lg border bg-gray-900">
                <video
                  className="aspect-video w-full"
                  controls
                  key={mediaUrl}
                  preload="metadata"
                  src={mediaUrl}
                >
                  <track kind="captions" />
                </video>
              </div>
            </div>
          )}

          {/* Info sobre URL atual */}
          {template.headerMediaUrl && !mediaUrl && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <p className="font-medium">URL atual será removida</p>
              <p className="text-xs opacity-80">
                Ao salvar com o campo vazio, a URL será removida e o template não poderá ser enviado até configurar uma nova URL.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
          <Button disabled={isPending} onClick={handleSave} type="button">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
