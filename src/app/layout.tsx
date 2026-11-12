import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastHost } from "@/components/ui/ui";

export const metadata: Metadata = {
  title: { default: "CarePass — Care for family back home, start to finish", template: "%s · CarePass" },
  description:
    "Choose a care package, pick a vetted provider, and follow every step until care is completed for family in Nigeria.",
};

export const viewport: Viewport = {
  themeColor: "#072A31",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
          <ToastHost />
        </StoreProvider>
      </body>
    </html>
  );
}
