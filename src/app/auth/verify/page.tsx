import { ReturnButton } from "@/components/return-button";
import { SendVerificationEmailForm } from "@/components/send-verification-email-form";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ error: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const error = (await searchParams).error;

  if (!error) redirect("/profile");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-lg" />
      </div>
      
      <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
        <div className="space-y-4">
          <ReturnButton href="/auth/login" label="Login" />

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verify Email</h1>
        </div>

        <p className="text-red-600 dark:text-red-400">
          <span className="capitalize">
            {error.replace(/_/g, " ").replace(/-/g, " ")}
          </span>{" "}
          - Please request a new verification email.
        </p>

        <SendVerificationEmailForm />
      </div>
    </div>
  );
}