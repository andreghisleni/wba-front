import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Facebook, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWhatsappOnboard } from '@/http/generated';
import { useFacebookEmbeddedSignup } from '@/hooks/use-facebook-embedded-signup';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useCallback } from 'react';

export const Route = createFileRoute('/_app/$organizationSlug/whatsapp/connect')({
  component: WhatsAppConnectPage,
});

function WhatsAppConnectPage() {
  const navigate = useNavigate();
  const { organizationSlug } = Route.useParams();

  // Busca a configuração do Embedded Signup
  const { data: config, isLoading: isLoadingConfig, error: configError } = useQuery({
    queryKey: ['embedded-signup-config'],
    queryFn: async () => {
      const res = await api.get<{ appId: string; configId: string }>('/whatsapp/embedded-signup/config');
      return res.data;
    },
    retry: false,
  });

  // Mutation para o onboarding
  const { mutateAsync: onboard, isPending: isOnboarding } = useWhatsappOnboard();

  // Callback de sucesso do Embedded Signup
  const handleSuccess = useCallback(async (response: { code?: string }) => {
    if (!response.code) {
      toast.error('Erro ao obter código de autorização');
      return;
    }

    try {
      await onboard({ data: { code: response.code } });
      toast.success('WhatsApp conectado com sucesso!');
      navigate({ to: '/$organizationSlug/whatsapp/chat', params: { organizationSlug } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar WhatsApp';
      toast.error(errorMessage);
    }
  }, [onboard, navigate, organizationSlug]);

  const handleCancel = useCallback(() => {
    toast.info('Conexão cancelada');
  }, []);

  const handleError = useCallback((error: Error) => {
    toast.error(error.message || 'Erro ao iniciar conexão');
  }, []);

  // Hook do Facebook Embedded Signup
  const { isSDKLoaded, isLoading: isSDKLoading, launchEmbeddedSignup } = useFacebookEmbeddedSignup({
    appId: config?.appId ?? '',
    configId: config?.configId ?? '',
    onSuccess: handleSuccess,
    onCancel: handleCancel,
    onError: handleError,
  });

  if (isLoadingConfig) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center justify-center rounded-lg border p-6 shadow-sm">
        <Loader2 className="mb-4 h-6 w-6 animate-spin text-gray-500" />
        <p className="text-gray-500 text-sm">Carregando configuração...</p>
      </div>
    );
  }

  if (configError) {
    const errorData = (configError as { response?: { data?: { error?: string } } })?.response?.data;
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center justify-center rounded-lg border p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-xl">
          Erro ao carregar configuração
        </h2>
        <p className="text-red-500 text-sm">
          {errorData?.error || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  const isProcessing = isSDKLoading || isOnboarding;

  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center justify-center rounded-lg border p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-xl">Conectar WhatsApp Business</h2>
      <p className="mb-6 text-center text-gray-500 text-sm">
        Clique no botão abaixo para conectar sua conta do WhatsApp Business.
        O processo será feito diretamente nesta página.
      </p>

      <Button
        onClick={launchEmbeddedSignup}
        disabled={!isSDKLoaded || isProcessing}
        className="flex w-full gap-2 bg-[#1877F2] text-white hover:bg-[#166fe5]"
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Facebook className="h-5 w-5" />
        )}
        {isOnboarding ? 'Conectando...' : 'Conectar com Facebook'}
      </Button>

      {!isSDKLoaded && (
        <p className="mt-4 text-gray-400 text-xs">
          Carregando SDK do Facebook...
        </p>
      )}
    </div>
  );
}
