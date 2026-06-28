import type { Metadata } from "next";
import "./globals.css";
import { PaperProvider } from "@/context/PaperContext";
import { ToastProvider } from "@/context/ToastContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "AI Voice Paper - School Paper Builder",
  description: "Create examination papers using voice typing and manual editing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ErrorBoundary>
          <PaperProvider>
            <ToastProvider>{children}</ToastProvider>
          </PaperProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
