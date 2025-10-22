import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you requested doesn’t exist.</p>
    </section>
  );
}
