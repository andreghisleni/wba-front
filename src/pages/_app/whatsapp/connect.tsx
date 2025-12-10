import { createFileRoute } from '@tanstack/react-router';

import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";


export const Route = createFileRoute('/_app/whatsapp/connect')({
  component: WhatsAppConnectPage,
})

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

function WhatsAppConnectPage() {
  const handleConnect = () => {
    // 1. Configurações (Idealmente mover para variáveis de ambiente)
    const FACEBOOK_APP_ID = "1592119725123894";

    // IMPORTANTE: Essa URL deve ser EXATAMENTE igual à cadastrada no painel da Meta
    // Use http://localhost:PORTA se estiver testando localmente sem HTTPS
    const REDIRECT_URI = "https://webhooks.andreg.com.br/webhook/oauth/callback"//"http://localhost:5173/auth/callback";

    // Escopos necessários para Provedor de Tecnologia (Tech Provider)
    // Ajuste conforme sua necessidade real
    const SCOPE = [
      "public_profile",
      "email",
      "whatsapp_business_management",
      "whatsapp_business_messaging"
    ].join(",");

    // Gera um estado aleatório para segurança (CSRF protection)
    // No mundo real, você salvaria isso no localStorage/cookie para verificar na volta
    const state = crypto.randomUUID();
    localStorage.setItem("oauth_state", state);

    // 2. Montagem da URL de Autorização Manual
    const rootUrl = "https://www.facebook.com/v21.0/dialog/oauth";

    const options = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: REDIRECT_URI,
      state: state,
      scope: SCOPE,
      response_type: "code", // Queremos o 'code' para trocar no backend
    });

    // 3. Redirecionamento Total (Adeus erro de HTTPS/Pop-up bloqueado)
    window.location.href = `${rootUrl}?${options.toString()}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-lg shadow-sm max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Conectar WhatsApp Business</h2>
      <p className="text-gray-500 mb-6 text-center text-sm">
        Você será redirecionado para o Facebook para autorizar o acesso ao portfólio empresarial.
      </p>

      <Button
        onClick={handleConnect}
        className="bg-[#1877F2] hover:bg-[#166fe5] text-white w-full flex gap-2"
      >
        <Facebook className="w-5 h-5" />
        Continuar com Facebook
      </Button>
    </div>
  );
}