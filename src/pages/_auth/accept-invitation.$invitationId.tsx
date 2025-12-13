/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/lib/auth';

export const Route = createFileRoute('/_auth/accept-invitation/$invitationId')({
  component: AcceptInvitationPage,
  beforeLoad: async () => {
    const { data } = await auth.getSession();
    if (!data) {
      throw redirect({ to: '/sign-in', search: { callbackURL: window.location.href } });
    }
  },
});

function AcceptInvitationPage() {
  const { invitationId } = Route.useParams();
  const navigate = useNavigate();
  const [invitationStatus, setInvitationStatus] = useState<
    'pending' | 'accepted' | 'rejected' | 'error'
  >('pending');

  // We can't use the hook directly for a single invitation easily if it's not in the list hook
  // So we'll use the client directly in useEffect or useQuery if we had it set up for this specific call
  // But better-auth client is async.

  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending: isSessionLoading } = auth.useSession();

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const { data, error: err } = await auth.organization.getInvitation({
          query: {
            id: invitationId,
          },
        });

        if (err) {
          setError(err.message || 'Erro ao carregar convite');
          setInvitationStatus('error');
        } else {
          setInvitation(data);
        }
      } catch {
        setError('Erro ao carregar convite');
        setInvitationStatus('error');
      } finally {
        setIsLoading(false);
      }
    }

    if (invitationId) {
      fetchInvitation();
    }
  }, [invitationId]);

  async function handleAccept() {
    if (!session) {
      navigate({
        to: '/sign-in',
        search: { callbackURL: window.location.href },
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error: err } = await auth.organization.acceptInvitation({
        invitationId,
      });

      if (err) {
        toast.error(err.message || 'Erro ao aceitar convite');
      } else {
        toast.success('Convite aceito com sucesso!');
        setInvitationStatus('accepted');
        setTimeout(() => {
          navigate({ to: '/dashboard' });
        }, 2000);
      }
    } catch {
      toast.error('Erro ao aceitar convite');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    if (!session) {
      navigate({
        to: '/sign-in',
        search: { callbackURL: window.location.href },
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error: err } = await auth.organization.rejectInvitation({
        invitationId,
      });

      if (err) {
        toast.error(err.message || 'Erro ao recusar convite');
      } else {
        toast.success('Convite recusado');
        setInvitationStatus('rejected');
      }
    } catch {
      toast.error('Erro ao recusar convite');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading || isSessionLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Carregando convite...</CardTitle>
          <CardDescription>Por favor, aguarde.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (invitationStatus === 'error' || !invitation) {
    return (
      <Card className="w-full border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Convite Inválido</CardTitle>
          <CardDescription>
            Não foi possível encontrar este convite. Ele pode ter expirado ou
            sido cancelado.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/dashboard">Voltar para o Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (invitationStatus === 'accepted') {
    return (
      <Card className="w-full border-green-500/50">
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-green-600'>
            <CheckCircle2 className="h-5 w-5" />
            Convite Aceito
          </CardTitle>
          <CardDescription>
            Você agora é membro da organização{' '}
            <strong>{invitation.organizationName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/dashboard">Ir para o Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (invitationStatus === 'rejected') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Convite Recusado
          </CardTitle>
          <CardDescription>
            Você recusou o convite para participar da organização.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/dashboard">Voltar para o Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Erro</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/dashboard">Voltar para o Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Convite para a organização: <strong>{invitation.organizationName}</strong></CardTitle>
        <CardDescription>
          Você foi convidado para participar da organização{' '}
          <strong>{invitation.organizationName}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1">
          <span className='font-medium text-muted-foreground text-sm'>
            Convidado por
          </span>
          <span>{invitation.inviterEmail}</span>
        </div>
        <div className="grid gap-1">
          <span className='font-medium text-muted-foreground text-sm'>
            Papel
          </span>
          <span className="capitalize">{invitation.role}</span>
        </div>
        {!session && (
          <div className='rounded-md bg-muted p-3 text-muted-foreground text-sm'>
            Você precisa estar logado para aceitar este convite.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {session ? (
          <>
            <Button className="w-full" onClick={handleAccept}>
              Aceitar Convite
            </Button>
            <Button className="w-full" onClick={handleReject} variant="outline">
              Recusar
            </Button>
          </>
        ) : (
          <Button asChild className="w-full">
            <Link search={{ callbackURL: window.location.href }} to="/sign-in">
              Entrar para Aceitar
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
