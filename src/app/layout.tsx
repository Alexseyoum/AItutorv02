import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TutorByAI - Your Personal AI Learning Companion",
    template: "%s | TutorByAI"
  },
  description: "Personalized AI-powered tutoring platform that adapts to your learning style. Get instant help with homework, practice quizzes, and achieve your academic goals with our intelligent tutoring system.",
  keywords: [
    "AI tutor",
    "online learning",
    "personalized education",
    "homework help",
    "study assistant",
    "academic support",
    "interactive learning",
    "educational technology"
  ],
  authors: [{ name: "TutorByAI Team" }],
  creator: "TutorByAI",
  publisher: "TutorByAI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tutorbyai.com",
    siteName: "TutorByAI",
    title: "TutorByAI - Your Personal AI Learning Companion",
    description: "Transform your learning experience with AI-powered personalized tutoring that adapts to your unique learning style and pace.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TutorByAI - AI-Powered Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TutorByAI - Your Personal AI Learning Companion",
    description: "Transform your learning experience with AI-powered personalized tutoring.",
    images: ["/og-image.png"],
    creator: "@tutorbyai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "education",
  classification: "Educational Technology",
  referrer: "origin-when-cross-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
