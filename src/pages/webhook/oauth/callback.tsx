/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { createFileRoute, useNavigate } from '@tanstack/react-router'; // Ou 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner'; // Ou useToast do Shadcn
import { useWhatsappOnboard } from '@/http/generated';

export const Route = createFileRoute('/webhook/oauth/callback')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  // Ref para evitar chamada dupla em React.StrictMode
  const hasCalledRef = useRef(false);

  // Hook do Kubb (React Query)
  const { mutate, isPending, isError, error } = useWhatsappOnboard({
    mutation: {
      onSuccess: (data) => {
        toast.success('Conexão realizada com sucesso!');

        // 1. Salvar token (ex: Zustand, Context ou localStorage)
        // Nota: O ideal é salvar em HttpOnly Cookie via backend,
        // mas se precisar usar no front agora:
        localStorage.setItem('fb_access_token', data.accessToken);

        // 2. Redirecionar para o Dashboard ou onde preferir
        setTimeout(() => {
          navigate({ to: '/dashboard' }); // Ajuste a rota de destino
        }, 1500);
      },
      onError: (err) => {
        console.error('Erro no login:', err);
        toast.error('Falha ao conectar com Facebook. Tente novamente.');
      },
    },
  });

  useEffect(() => {
    // Pegar params da URL (Funciona em qualquer Router)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    if (hasCalledRef.current) {
      return;
    }

    // Caso o usuário clique em "Cancelar" no Facebook
    if (errorParam) {
      hasCalledRef.current = true;
      toast.error('Acesso negado pelo usuário.');
      navigate({ to: '/dashboard' }); // Volta para tentar de novo
      return;
    }

    if (code) {
      hasCalledRef.current = true;
      // Chama a mutação passando o body que definimos no Elysia
      mutate({ data: { code } });
    } else {
      // Se chegou nessa tela sem código
      toast.error('Código de autorização não encontrado.');
      navigate({ to: '/dashboard' });
    }
  }, [mutate, navigate]);

  return (
    <div className='flex h-screen w-full flex-col items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-lg'>
        {/* ESTADO: CARREGANDO */}
        {isPending && (
          <>
            <Loader2 className='mx-auto h-12 w-12 animate-spin text-blue-600' />
            <h2 className='font-semibold text-gray-800 text-xl'>
              Conectando...
            </h2>
            <p className="text-gray-500">
              Estamos finalizando a configuração com a Meta.
            </p>
          </>
        )}

        {/* ESTADO: SUCESSO (Ocorre brevemente antes do redirect) */}
        {!(isPending || isError) && hasCalledRef.current && (
          <>
            <CheckCircle2 className='mx-auto h-12 w-12 text-green-500' />
            <h2 className='font-semibold text-gray-800 text-xl'>
              Tudo pronto!
            </h2>
            <p className="text-gray-500">Redirecionando você...</p>
          </>
        )}

        {/* ESTADO: ERRO */}
        {isError && (
          <>
            <XCircle className='mx-auto h-12 w-12 text-red-500' />
            <h2 className='font-semibold text-gray-800 text-xl'>
              Algo deu errado
            </h2>
            <p className='rounded bg-red-50 p-2 text-red-600 text-sm'>
              {/* Tenta mostrar a mensagem detalhada do backend se existir */}
              {(error as any)?.response?.data?.message ||
                'Não foi possível validar o código.'}
            </p>
            <button
              className='mt-4 rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-800'
              onClick={() => navigate({ to: '/dashboard' })}
              type='button'
            >
              Voltar e tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
