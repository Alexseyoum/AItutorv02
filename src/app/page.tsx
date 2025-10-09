import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import TutoringClient from "@/components/tutoring-client";
import { Button } from "@/components/ui/button";
import { Brain, Users, Zap, BookOpen, CheckCircle, Star, Rocket, Heart } from "lucide-react";
import Link from "next/link";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 relative overflow-hidden">
      {/* Fun Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-20 animate-float delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-20 animate-float delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-20 animate-float delay-500"></div>
      </div>

      {/* Navigation */}
      <Navigation showAuthButton={true} />

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-8 animate-bounce-in">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full px-6 py-3 mb-6">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">Perfect for Kids & Teens</span>
            </div>
          </div>
          
          <h1 className="text-display text-gray-900 dark:text-white mb-6 animate-fade-in leading-tight">
            Learn Anything with Your
            <span className="gradient-text-primary block mt-2"> AI Study Buddy! </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in delay-100 leading-relaxed">
            🎆 Get instant help with homework, practice fun quizzes, and learn at your own pace with our friendly AI tutor that makes studying feel like playing!
          </p>
          
          <div className="flex justify-center mb-12 animate-fade-in delay-200">
            <GetStartedButton />
          </div>

          {/* Fun Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <div className="text-center animate-scale-in delay-300 p-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl glass border border-white/20">
              <div className="text-4xl font-bold gradient-text-primary mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Happy Students
              </div>
            </div>
            <div className="text-center animate-scale-in delay-400 p-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl glass border border-white/20">
              <div className="text-4xl font-bold gradient-text-fun mb-2">1M+</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Questions Solved
              </div>
            </div>
            <div className="text-center animate-scale-in delay-500 p-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl glass border border-white/20">
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center gap-2">
                <Star className="w-4 h-4 text-green-500" />
                Success Rate
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Kid-Friendly Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-8 rounded-3xl bg-white/80 dark:bg-gray-800/80 glass border border-white/20 card-hover animate-fade-in delay-600">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse-glow">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-h3 font-bold mb-4 text-gray-900 dark:text-white">🚀 Instant Answers</h3>
            <p className="text-readable text-gray-600 dark:text-gray-300">
              Ask any question and get fun, easy-to-understand answers instantly! No more waiting or being stuck.
            </p>
          </div>

          <div className="text-center p-8 rounded-3xl bg-white/80 dark:bg-gray-800/80 glass border border-white/20 card-hover animate-fade-in delay-700">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl card-fun">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-h3 font-bold mb-4 text-gray-900 dark:text-white">🎆 Personal Tutor</h3>
            <p className="text-readable text-gray-600 dark:text-gray-300">
              Your AI learns how you like to study and creates fun lessons just for you. Like having a super-smart friend!
            </p>
          </div>

          <div className="text-center p-8 rounded-3xl bg-white/80 dark:bg-gray-800/80 glass border border-white/20 card-hover animate-fade-in delay-800">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-h3 font-bold mb-4 text-gray-900 dark:text-white">🎮 Fun Learning</h3>
            <p className="text-readable text-gray-600 dark:text-gray-300">
              Interactive games, quizzes, and challenges that make learning feel like playing your favorite game!
            </p>
          </div>
        </div>

        {/* Benefits Section - More Engaging for Kids */}
        <div className="bg-white/70 dark:bg-gray-800/70 glass rounded-3xl p-12 border border-white/30 shadow-2xl animate-fade-in delay-900 mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Rocket className="w-8 h-8 text-purple-600" />
              <h2 className="text-h1 text-gray-900 dark:text-white">
                Why Kids ❤️ TutorByAI?
              </h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join thousands of students who are having fun while learning!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="p-2 bg-green-500 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">🕰️ Available 24/7</h4>
                  <p className="text-gray-600 dark:text-gray-300">Study anytime you want - before school, after dinner, or even on weekends!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <div className="p-2 bg-blue-500 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">📚 All Subjects</h4>
                  <p className="text-gray-600 dark:text-gray-300">Math, science, English, history - we've got everything you need for school!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="p-2 bg-purple-500 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">📈 Track Progress</h4>
                  <p className="text-gray-600 dark:text-gray-300">See how much you've learned and earn cool badges for your achievements!</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
                <div className="p-2 bg-orange-500 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">🎯 Smart Difficulty</h4>
                  <p className="text-gray-600 dark:text-gray-300">Questions get easier or harder based on how you're doing - never too easy, never too hard!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20">
                <div className="p-2 bg-teal-500 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">💡 Step-by-Step Help</h4>
                  <p className="text-gray-600 dark:text-gray-300">Get explanations that are easy to understand, with examples and pictures!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20">
                <div className="p-2 bg-pink-500 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">💰 Super Affordable</h4>
                  <p className="text-gray-600 dark:text-gray-300">Get the best tutoring for way less than hiring a real tutor!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center animate-fade-in delay-1000">
          <div className="mb-8">
            <h2 className="text-h1 text-gray-900 dark:text-white mb-4">
              Ready to Make Learning 
              <span className="gradient-text-fun">Super Fun</span>? 🎉
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already having fun while getting smarter every day!
            </p>
          </div>
          <GetStartedButton />
          
          <div className="mt-8 flex justify-center items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Safe for kids</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-gray-900 to-purple-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="relative">
                <Brain className="h-6 w-6 text-purple-400" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl font-bold gradient-text-primary">TutorByAI</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 TutorByAI. Making learning fun for everyone! 🚀
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}