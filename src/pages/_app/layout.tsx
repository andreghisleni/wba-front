import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Header } from '@/components/navbar-components/header';
import { auth } from '@/lib/auth';

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
  beforeLoad: async () => {
    const { data } = await auth.getSession();
    if (!data) {
      throw redirect({ to: '/sign-in' });
    }
  },
  notFoundComponent: () => <div>App - 404!</div>,
});

function RouteComponent() {
  return (
    <div className="mb-5">
      <Header />
      <Outlet />
    </div>
  );
}
