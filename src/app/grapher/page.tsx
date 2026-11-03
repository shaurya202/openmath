'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CoordinateGrapher } from '@/components/grapher/CoordinateGrapher';

function GrapherInner() {
  const searchParams = useSearchParams();
  const rawFuncs = searchParams.get('funcs');

  const initialFuncs = rawFuncs
    ? rawFuncs.split(';').map((s) => decodeURIComponent(s.trim()))
    : ['x^2 - 4', '2*x + 1'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)]">
      <CoordinateGrapher initialFunctions={initialFuncs} />
    </div>
  );
}

export default function GrapherPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Grapher...</div>}>
      <GrapherInner />
    </Suspense>
  );
}
