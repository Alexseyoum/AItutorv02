// This would be the new marketing page at /marketing or /about
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Brain, Users, Zap, BookOpen, CheckCircle } from "lucide-react";
import Link from "next/link";
import { GetStartedButton } from "@/components/get-started-button";
import { headers } from "next/headers";

export default async function Marketing() {
  const headersList = await headers();

  const _session = await auth.api.getSession({
    headers: headersList
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600 dark:text-purple-400" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">TutorByAI</span>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" />
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Learn Anything with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered </span>
            Tutoring
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience personalized learning with our advanced AI tutor. Get instant answers, 
            interactive lessons, and adaptive learning paths tailored just for you.
          </p>
          <div className="flex justify-center mb-16">
            <GetStartedButton />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">50K+</div>
              <div className="text-gray-600 dark:text-gray-400">Students Learning</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">1M+</div>
              <div className="text-gray-600 dark:text-gray-400">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">95%</div>
              <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Instant Answers</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get immediate, accurate responses to any question across multiple subjects and topics.
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Personalized Learning</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Adaptive AI that learns your style and creates customized lesson plans for optimal growth.
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Interactive Lessons</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Engaging, hands-on learning experiences with real-time feedback and progress tracking.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose TutorByAI?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Experience the future of education with our cutting-edge AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Availability</h4>
                  <p className="text-gray-600 dark:text-gray-300">Learn at your own pace, anytime, anywhere with our always-available AI tutor.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Multi-Subject Support</h4>
                  <p className="text-gray-600 dark:text-gray-300">From math and science to languages and history - we cover it all.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Progress Tracking</h4>
                  <p className="text-gray-600 dark:text-gray-300">Monitor your learning journey with detailed analytics and insights.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Adaptive Difficulty</h4>
                  <p className="text-gray-600 dark:text-gray-300">AI adjusts question difficulty based on your performance and learning pace.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Interactive Explanations</h4>
                  <p className="text-gray-600 dark:text-gray-300">Step-by-step breakdowns that make complex concepts easy to understand.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Affordable Learning</h4>
                  <p className="text-gray-600 dark:text-gray-300">Get world-class tutoring at a fraction of traditional tutoring costs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already experiencing the power of AI-driven education.
          </p>
          <GetStartedButton />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">TutorByAI</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 TutorByAI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}