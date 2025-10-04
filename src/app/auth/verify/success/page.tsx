import { ReturnButton } from "@/components/return-button";

export default function Page() {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-green-600">✅ Email Verified!</h1>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <p className="text-green-800 mb-4">
            Great! Your email has been successfully verified.
          </p>
          <p className="text-green-700">
            You can now log in and start your personalized AI tutoring experience.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <ReturnButton href="/auth/login" label="Login Now" />
          <ReturnButton href="/" label="Back to Home" />
        </div>
      </div>
    </div>
  );
}