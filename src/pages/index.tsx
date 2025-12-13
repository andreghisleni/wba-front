import { createFileRoute, Navigate } from '@tanstack/react-router';
import { auth } from '@/lib/auth';

export const Route = createFileRoute('/')({
  component: Home,
});

export function Home() {
  const { data: userData, isPending: isUserLoading } = auth.useSession();
  const { data, isPending } = auth.useActiveOrganization()

  if (isPending || isUserLoading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <Navigate replace to="/sign-in" />;
  }

  if (!data) {
    return <Navigate replace to="/dashboard" />;
  }

  const activeOrganization = data.slug as string | undefined;

  if (activeOrganization) {
    return (
      <Navigate
        params={{ organizationSlug: activeOrganization }}
        replace
        to="/$organizationSlug/dashboard"
      />
    );
  }

  return <Navigate replace to="/dashboard" />;
}
