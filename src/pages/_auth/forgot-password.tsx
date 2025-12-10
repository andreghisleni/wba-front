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

export const Route = createFileRoute('/_auth/forgot-password')({
  component: RouteComponent,
});

const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

// Mock Route definition
function RouteComponent() {
  const [authError, setAuthError] = useState<string | null>(null);

  // Form setup with React Hook Form
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Function to handle form submission
  async function onSubmit(values: ForgotPasswordSchema) {
    setAuthError(null);

    const { error } = await auth.requestPasswordReset({
      email: values.email,
    });

    if (error) {
      setAuthError(error.message || 'An unexpected error occurred.');
      toast.error(error.message || 'An unexpected error occurred.');
      return;
    }

    toast.success('Password reset email sent!');
    // navigate({ to: '/sign-in', search: { email: values.email } });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Email Field */}
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
                ? 'Sending reset email...'
                : 'Send reset email'}
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
