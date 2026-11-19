import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastHost } from "@/components/ui/ui";

export const metadata: Metadata = {
  title: { default: "CarePass: Care for family back home", template: "%s | CarePass" },
  description:
    "Plan and pay for a relative's treatment in Nigeria. Choose a care plan and a verified clinic, follow each step, and money is released only when the clinic confirms the visit.",
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
