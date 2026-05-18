import type { Metadata } from "next";
import "@/src/app/globals.css";
import SensoryProvider from "@/components/providers/SensoryProvider";
import ToastHost from "@/components/providers/ToastHost";

export const metadata: Metadata = {
  title: "EmoSense — Understand emotions at your own pace",
  description:
    "Facial expression insights, behaviour patterns, and a gentle emotion dictionary for autistic individuals, caregivers, and therapists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="relative min-h-full overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
        <SensoryProvider>
          {children}
          <ToastHost />
        </SensoryProvider>
      </body>
    </html>
  );
}
