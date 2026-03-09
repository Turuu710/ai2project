import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkLoaded,
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
} from "@clerk/nextjs";
import Header from "@/components/Header";
import { UserProvider } from "@/contexts/UserContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz App",
  description: "Test your knowledge with our quiz app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={inter.className}>
          <ClerkLoaded>
            <SignedIn>
              <UserProvider>
                <Header />
                <main className="mx-auto">{children}</main>
              </UserProvider>
            </SignedIn>
            <SignedOut>
              <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="p-6 w-full max-w-md">
                  <SignIn />
                </div>
              </div>
            </SignedOut>
          </ClerkLoaded>
        </body>
      </html>
    </ClerkProvider>
  );
}
