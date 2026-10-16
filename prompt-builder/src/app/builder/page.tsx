import type { Metadata } from 'next';
import { BuilderLoader } from '@/components/builder/builder-loader';

export const metadata: Metadata = {
  title: 'Builder',
  description: 'Fill in a prompt template, check it, and export it as text or a Claude API call.',
};

export default function BuilderPage() {
  return <BuilderLoader />;
}
