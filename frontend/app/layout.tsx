import type { Metadata, Viewport } from "next";

import { ClearSpace3D } from "@/components/background/ClearSpace3D";
import { AuthProvider } from "@/features/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearSpace",
  description: "A calm brain inbox for clearing your mind.",
  icons: {
    icon: "/icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0d0d"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClearSpace3D />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

