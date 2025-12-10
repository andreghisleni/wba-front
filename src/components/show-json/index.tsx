import { lazy, Suspense } from 'react';

// 1. Use React.lazy para importar o componente dinamicamente.
const LazyShowJson = lazy(() => import('./show-json'));

// 2. O componente wrapper agora usa <Suspense> para lidar com o estado de carregamento.
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function ShowJson({ data }: { data: any }) {
  // eslint-disable-line
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LazyShowJson data={data} />
    </Suspense>
  );
}
