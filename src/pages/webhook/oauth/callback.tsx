import { createFileRoute } from '@tanstack/react-router'

import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router"; // Ou 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner"; // Ou useToast do Shadcn
import { useWhatsappOnboard } from '@/http/generated';

export const Route = createFileRoute('/webhook/oauth/callback')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  // Ref para evitar chamada dupla em React.StrictMode
  const hasCalledRef = useRef(false);

  // Hook do Kubb (React Query)
  const { mutate, isPending, isError, error } = useWhatsappOnboard({
    mutation: {
      onSuccess: (data) => {
        toast.success("Conexão realizada com sucesso!");

        // 1. Salvar token (ex: Zustand, Context ou localStorage)
        // Nota: O ideal é salvar em HttpOnly Cookie via backend, 
        // mas se precisar usar no front agora:
        localStorage.setItem("fb_access_token", data.accessToken);

        // 2. Redirecionar para o Dashboard ou onde preferir
        setTimeout(() => {
          navigate({ to: "/dashboard" }); // Ajuste a rota de destino
        }, 1500);
      },
      onError: (err) => {
        console.error("Erro no login:", err);
        toast.error("Falha ao conectar com Facebook. Tente novamente.");
      }
    }
  });

  useEffect(() => {
    // Pegar params da URL (Funciona em qualquer Router)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (hasCalledRef.current) return;

    // Caso o usuário clique em "Cancelar" no Facebook
    if (errorParam) {
      hasCalledRef.current = true;
      toast.error("Acesso negado pelo usuário.");
      navigate({ to: "/settings" }); // Volta para tentar de novo
      return;
    }

    if (code) {
      hasCalledRef.current = true;
      // Chama a mutação passando o body que definimos no Elysia
      mutate({ data: { code } });
    } else {
      // Se chegou nessa tela sem código
      toast.error("Código de autorização não encontrado.");
      navigate({ to: "/settings" });
    }
  }, [mutate, navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center space-y-4">

        {/* ESTADO: CARREGANDO */}
        {isPending && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-800">Conectando...</h2>
            <p className="text-gray-500">Estamos finalizando a configuração com a Meta.</p>
          </>
        )}

        {/* ESTADO: SUCESSO (Ocorre brevemente antes do redirect) */}
        {!isPending && !isError && hasCalledRef.current && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-800">Tudo pronto!</h2>
            <p className="text-gray-500">Redirecionando você...</p>
          </>
        )}

        {/* ESTADO: ERRO */}
        {isError && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-800">Algo deu errado</h2>
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {/* Tenta mostrar a mensagem detalhada do backend se existir */}
              {(error as any)?.response?.data?.message || "Não foi possível validar o código."}
            </p>
            <button
              onClick={() => navigate({ to: "/settings" })}
              className="mt-4 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Voltar e tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}