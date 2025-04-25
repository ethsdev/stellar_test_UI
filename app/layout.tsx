// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import React from "react";
import { WalletProvider } from "./context/WalletContext";
import { ConnectButton } from "./component/ConnectWalletButton";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Stellar Payment DApp",
  description: "Payment DApp built on Stellar blockchain network",
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h1 className="text-3xl font-bold text-gray-900">Test DApp</h1>
                    </div>
                  </div>
                  <ConnectButton />
                </div>
              </div>
            </header>
            <main className="flex-grow">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-md rounded-lg">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
};

export default Layout;