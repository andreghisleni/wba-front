import { createFileRoute, Link } from '@tanstack/react-router';
import { Facebook, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenerateWhatsappOauthLink } from '@/http/generated';

export const Route = createFileRoute('/_app/$organizationSlug/whatsapp/connect')({
  component: WhatsAppConnectPage,
});

function WhatsAppConnectPage() {
  const { data, isLoading, error } = useGenerateWhatsappOauthLink(undefined, {
    query: {
      retry: false,
    }
  });

  if (isLoading) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center justify-center rounded-lg border p-6 shadow-sm">
        <Loader2 className="mb-4 h-6 w-6 animate-spin text-gray-500" />
        <p className="text-gray-500 text-sm">Gerando link de conexão...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center justify-center rounded-lg border p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-xl">
          Erro ao gerar link de conexão
        </h2>
        <p className="text-red-500 text-sm">
          {error.response.data.error || error.message}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center justify-center rounded-lg border p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-xl">Conectar WhatsApp Business</h2>
      <p className="mb-6 text-center text-gray-500 text-sm">
        Você será redirecionado para o Facebook para autorizar o acesso ao
        portfólio empresarial.
      </p>

      <Button
        asChild
        className="flex w-full gap-2 bg-[#1877F2] text-white hover:bg-[#166fe5]"
      >
        <Link disabled={isLoading} href={data.url} to={data.url}>
          <Facebook className="h-5 w-5" />
          Continuar com Facebook
        </Link>
      </Button>
    </div>
  );
}
