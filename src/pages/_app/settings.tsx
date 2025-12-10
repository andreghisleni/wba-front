import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings')({
  component: () => RouteComponent(),
});

function RouteComponent() {
  return (
    <main className="container flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      Settings
    </main>
  );
}
