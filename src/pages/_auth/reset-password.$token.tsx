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

const resetPasswordSearchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute('/_auth/reset-password/$token')({
  component: ResetPassword,
  validateSearch: (search) => resetPasswordSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Reset Password' }] }),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters long',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Path to show the error message
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

function ResetPassword() {
  const { token } = Route.useParams();
  const { email } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  // Form setup with React Hook Form
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Function to handle form submission
  async function onSubmit(values: ResetPasswordSchema) {
    setAuthError(null);
    const { confirmPassword: _, ...resetPasswordData } = values;

    const { error } = await auth.resetPassword({
      token,
      newPassword: resetPasswordData.password,
    });

    if (error) {
      setAuthError(error.message || 'An unexpected error occurred.');
      // toast.error is not defined, so we'll log to console
      return;
    }

    toast.success('Password has been reset successfully. Please sign in.');
    navigate({ to: '/sign-in', replace: true, search: { email } });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display authentication error */}
            {authError && (
              <p className="font-medium text-red-600 text-sm">{authError}</p>
            )}

            <Button
              className="w-full rounded-md bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? 'Creating account...'
                : 'Create account'}
            </Button>

            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link className="underline underline-offset-4" to="/sign-in">
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
