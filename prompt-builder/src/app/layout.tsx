import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PromptPal - AI Prompt Builder',
  description: 'Create high-quality prompts for ChatGPT, Claude, and other AI models with our intuitive prompt builder.',
  keywords: ['AI', 'prompt', 'builder', 'ChatGPT', 'Claude', 'LLM', 'artificial intelligence'],
  authors: [{ name: 'PromptPal Team' }],
  creator: 'PromptPal',
  publisher: 'PromptPal',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://promptpal.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://promptpal.app',
    title: 'PromptPal - AI Prompt Builder',
    description: 'Create high-quality prompts for ChatGPT, Claude, and other AI models with our intuitive prompt builder.',
    siteName: 'PromptPal',
    images: [
      {
        url: '/meta-images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PromptPal - AI Prompt Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptPal - AI Prompt Builder',
    description: 'Create high-quality prompts for ChatGPT, Claude, and other AI models with our intuitive prompt builder.',
    images: ['/meta-images/twitter-image.png'],
    creator: '@promptpal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
} 