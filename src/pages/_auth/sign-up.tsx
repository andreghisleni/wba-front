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

// Esquema para os parâmetros de busca da URL
const signUpSearchSchema = z.object({
  callbackURL: z.string().url().optional(),
});

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUp,
  validateSearch: (search) => signUpSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: 'Sign Up' }],
  }),
});

const signUpSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Please enter your name',
    }),
    email: z.string().email({
      message: 'Please enter a valid email address',
    }),
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters long',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Path to show the error message
  });

type SignUpSchema = z.infer<typeof signUpSchema>;

// Mock Route definition
function SignUp() {
  const navigate = Route.useNavigate();
  const { callbackURL } = Route.useSearch();
  const [authError, setAuthError] = useState<string | null>(null);

  // Form setup with React Hook Form
  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Function to handle form submission
  async function onSubmit(values: SignUpSchema) {
    setAuthError(null);
    const { confirmPassword: _, ...signUpData } = values;

    const { error } = await auth.signUp.email(signUpData);

    if (error) {
      setAuthError(error.message || 'An unexpected error occurred.');
      // toast.error is not defined, so we'll log to console
      return;
    }

    // toast.success is not defined, so we'll log to console
    toast.success('Account created successfully! Please sign in.');
    navigate({ to: '/sign-in', search: { email: values.email, callbackURL } });
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
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Password Field */}
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

            {/* Confirm Password Field */}
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
              <Link
                className="underline underline-offset-4"
                search={{ callbackURL }}
                to="/sign-in"
              >
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
