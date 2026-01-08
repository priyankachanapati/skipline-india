import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Queueless India - Avoid Long Queues at Government Offices',
  description: 'Find real-time crowd levels and estimated waiting times at Indian government offices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen bg-dark-900">
        <nav className="glass sticky top-0 z-10 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <a href="/" className="text-xl font-bold text-primary-400 hover:text-primary-300 transition-colors">
                Queueless India
              </a>
              <div className="text-sm text-dark-300">
                🇮🇳 Skip the Queue
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="glass border-t border-white/10 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-dark-400">
              Made with ❤️ for India | Help others by reporting crowd levels
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
