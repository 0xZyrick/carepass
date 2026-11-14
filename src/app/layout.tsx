import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastHost } from "@/components/ui/ui";

export const metadata: Metadata = {
  title: { default: "CarePass — Send care, not cash", template: "%s · CarePass" },
  description:
    "CarePass lets you fund a relative's medical care abroad with rules you control. The money can only be spent at verified hospitals, labs and pharmacies, and every payment is visible to you.",
};

export const viewport: Viewport = {
  themeColor: "#052619",
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
