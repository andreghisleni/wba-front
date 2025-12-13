import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/$organizationSlug')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
