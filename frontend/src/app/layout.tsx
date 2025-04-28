import './globals.css';
import { Inter } from 'next/font/google';
import { ContractProvider } from '../contexts/ContractContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Energy Blockchain dApp',
  description: 'A Next.js dApp for energy logging, trading, and certificates',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ContractProvider>
          {children}
        </ContractProvider>
      </body>
    </html>
  );
}
