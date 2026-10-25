import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Nunito } from "next/font/google";
import "@/src/app/globals.css";
import SensoryProvider from "@/components/providers/SensoryProvider";
import ToastHost from "@/components/providers/ToastHost";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-nunito",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EmoSense — Understand emotions at your own pace",
  description:
    "Facial expression insights, behaviour patterns, and a gentle emotion dictionary for autistic individuals, caregivers, and therapists.",
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  width: "device-width",
  initialScale: 1,
};

// Apply saved sensory preferences before first paint to avoid a theme flash.
const sensoryBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem("emosense-store")||"{}");var p=s&&s.state&&s.state.sensory;if(!p)return;var r=document.documentElement;r.dataset.font=p.fontSize;r.dataset.contrast=p.contrast;r.dataset.motion=p.motion;r.dataset.theme=p.theme;var m={sm:"0.875",md:"1",lg:"1.125",xl:"1.25"};if(m[p.fontSize])r.style.setProperty("--font-scale",m[p.fontSize]);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${dmSans.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: sensoryBootScript }} />
      </head>
      <body className="relative min-h-full overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
        <SensoryProvider>
          {children}
          <ToastHost />
        </SensoryProvider>
      </body>
    </html>
  );
}
