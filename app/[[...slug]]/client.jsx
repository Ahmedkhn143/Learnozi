'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../src/AppSPA'), { ssr: false });

export function ClientOnly() {
  return <App />;
}
