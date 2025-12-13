import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/auth';

// Esquema de validação com Zod
const signInSchema = z.object({
  email: z.string().email({
    message: 'Enter a valid email address',
  }),
  password: z.string().min(1, {
    message: 'Enter a valid password',
  }),
});

type SignInSchema = z.infer<typeof signInSchema>;

// Esquema para os parâmetros de busca da URL
const signInSearchSchema = z.object({
  email: z.string().email().optional(),
  callbackURL: z.string().url().optional(),
});

// Definição da rota com Tanstack Router
export const Route = createFileRoute('/_auth/sign-in')({
  component: SignIn,
  validateSearch: (search) => signInSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: 'Sign In' }],
  }),
});

function SignIn() {
  const navigate = Route.useNavigate();
  const { email, callbackURL } = Route.useSearch();
  const [authError, setAuthError] = useState<string | null>(null);

  // Configuração do formulário com React Hook Form
  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: email ?? '',
      password: '',
    },
  });

  const { isSubmitting } = form.formState;

  // Função para lidar com a submissão do formulário
  async function onSubmit(values: SignInSchema) {
    setAuthError(null);
    const { error, data } = await auth.signIn.email(values);

    if (error) {
      setAuthError(error.message || 'An unexpected error occurred.');
      toast.error(error.message || 'An unexpected error occurred.');
      return;
    }

    toast.success(`Bem-vindo ${data.user.name} ${callbackURL}`);
    // Navega para o dashboard após o login bem-sucedido
    navigate({ to: callbackURL ?? '/', replace: true, href: callbackURL ?? '/' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account '{callbackURL}'
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Campo de Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="m@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de Senha */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Link
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      to="/forgot-password"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exibição de erro de autenticação */}
            {authError && (
              <p className="font-medium text-destructive text-sm">
                {authError}
              </p>
            )}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link
                className="underline underline-offset-4"
                search={{ callbackURL }}
                to="/sign-up"
              >
                Sign up
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
