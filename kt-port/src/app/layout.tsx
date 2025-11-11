import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata: Metadata = {
  title: "Kyle's REIT - Real Estate Investment Dashboard",
  description: "Professional real estate investment trust dashboard for portfolio analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome for icons */}
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        
        {/* Bootstrap JS */}
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          async
        ></script>
      </body>
    </html>
  );
}
