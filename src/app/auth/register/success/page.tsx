import { ReturnButton } from "@/components/return-button";

export default function Page() {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-4">🎉 Registration Successful!</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">What's Next?</h2>
            <ol className="text-left text-blue-700 space-y-2">
              <li className="flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                Check your email for a verification link
              </li>
              <li className="flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                Click the link to verify your account
              </li>
              <li className="flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
                Login and complete your learning profile
              </li>
              <li className="flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">4</span>
                Start your personalized AI tutoring experience!
              </li>
            </ol>
          </div>

          <p className="text-gray-600 mb-6">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <ReturnButton href="/auth/login" label="Go to Login" />
          <ReturnButton href="/" label="Back to Home" />
        </div>
      </div>
    </div>
  );
}