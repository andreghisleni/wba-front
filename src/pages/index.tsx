import { createFileRoute, Navigate } from '@tanstack/react-router';
import { auth } from '@/lib/auth';

export const Route = createFileRoute('/')({
  component: Home,
});

export function Home() {
  const { data, isPending } = auth.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  // if (!data) {
  //   return <Navigate replace to="/sign-in" />;
  // }

  // biome-ignore lint/suspicious/noExplicitAny: typing is incomplete
  // const lastUserEventId = (data.user as any).lastUserEventId as
  //   | string
  //   | undefined;

  // if (lastUserEventId) {
  //   return (
  //     <Navigate
  //       params={{ eventId: lastUserEventId }}
  //       replace
  //       to="/$eventId/dashboard"
  //     />
  //   );
  // }

  return <Navigate replace to="/dashboard" />;
}
