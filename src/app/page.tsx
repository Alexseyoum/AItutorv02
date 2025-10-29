import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import TutoringClient from "@/components/tutoring-client";
import { Brain, Users, Zap, BookOpen, CheckCircle, Star } from "lucide-react";
import { GetStartedButton } from "@/components/get-started-button";
import { Navigation } from "@/components/ui/navigation";

export default async function Home() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList
  });

  // If user is authenticated, show the AI dashboard
  if (session) {
    return <TutoringClient user={session.user} />;
  }

  // If user is not authenticated, show the marketing/landing page
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <Navigation showAuthButton={true} />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Smarter Learning with
            <span className="text-blue-600 dark:text-blue-400"> AI-Powered Tutoring</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant answers, personalized study plans, and interactive AI chat - all at a fraction of the cost of traditional tutoring services.
          </p>
          <div className="flex justify-center mb-16">
            <GetStartedButton />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10K+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Students</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">500K+</div>
              <div className="text-gray-600 dark:text-gray-400">Questions Answered</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">90%</div>
              <div className="text-gray-600 dark:text-gray-400">Improved Grades</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Instant Answers</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get immediate, accurate responses to any academic question across multiple subjects.
            </p>
          </div>

          <div className="text-center p-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Personalized Learning</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Adaptive AI that creates customized learning paths based on your strengths and weaknesses.
            </p>
          </div>

          <div className="text-center p-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Progress Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed analytics and insights to monitor your learning journey and identify improvement areas.
            </p>
          </div>
        </div>

        {/* Unique Value Proposition Section */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-12 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Makes TutorByAI Different?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Advanced AI features that other platforms don't offer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-blue-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center text-gray-900 dark:text-white">AI-Powered Summaries</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Turn lectures, videos, and notes into concise study materials instantly - a feature unique to TutorByAI.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-blue-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center text-gray-900 dark:text-white">Interactive AI Chat</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Have real conversations with our AI tutor to get personalized explanations and guidance.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-blue-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center text-gray-900 dark:text-white">Multi-Format Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Upload documents, images, or type directly - our AI understands multiple input formats.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Students Are Saying
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Join thousands of students who have transformed their learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">A</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Alex M.</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">10th Grade Student</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "TutorByAI helped me understand algebra concepts I'd been struggling with for months. My test scores improved by 20% in just three weeks!"
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">S</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Sophia R.</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">11th Grade Student</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "The SAT prep features are amazing! I've been using TutorByAI for two months and my practice test scores keep going up. Highly recommend for college prep."
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">M</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Maya K.</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">9th Grade Student</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "I used to hate chemistry, but TutorByAI made it so much easier to understand. The step-by-step explanations are perfect for visual learners like me."
              </p>
            </div>
          </div>
        </div>

        {/* Subject Areas Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Subject Coverage
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get help with all your core subjects and beyond
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Mathematics</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Science</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">English</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">History</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">SAT Prep</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Languages</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Writing</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Test Prep</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already experiencing the power of AI-driven education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <GetStartedButton />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Start your free 7-day trial. No credit card required.
          </p>
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