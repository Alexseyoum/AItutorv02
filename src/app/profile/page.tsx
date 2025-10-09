import { ChangePasswordForm } from "@/components/change-password-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { UpdateUserForm } from "@/components/update-user-form";
import { Navigation } from "@/components/ui/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Brain, User, Shield, Settings, GraduationCap, BookOpen, Target, Clock, Heart, Star, Sparkles, Trophy } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) redirect("/auth/login");

  const FULL_POST_ACCESS = await auth.api.userHasPermission({
    body: {
      userId: session.user.id,
      permissions: {
        posts: ["update", "delete"],
      },
    },
  });

  // Fetch student profile data directly from database
  let studentProfile = null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isOnboarded: true,
        gradeLevel: true,
        age: true,
        school: true,
        subjects: true,
        learningGoals: true,
        learningStyle: true,
        difficultyLevel: true,
        sessionDuration: true,
        interests: true,
        pastEngagement: true
      }
    });

    if (user) {
      studentProfile = {
        gradeLevel: user.gradeLevel,
        age: user.age,
        school: user.school,
        subjects: user.subjects,
        learningGoals: user.learningGoals,
        learningStyle: user.learningStyle,
        difficultyLevel: user.difficultyLevel,
        sessionDuration: user.sessionDuration,
        interests: user.interests,
        pastEngagement: user.pastEngagement || 0,
        isOnboarded: user.isOnboarded
      };
    }
  } catch (error) {
    console.error("Failed to fetch student profile:", error);
  }

  const formatLearningStyle = (style: string) => {
    if (!style) return "Not specified";
    return style.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDifficultyLevel = (level: string) => {
    if (!level) return "Not specified";
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 relative overflow-hidden">
      {/* Fun Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-r from-blue-300 to-purple-400 rounded-full opacity-10 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-orange-500 rounded-full opacity-10 animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-10 animate-float delay-2000"></div>
      </div>

      {/* Navigation */}
      <Navigation 
        showBackButton={true} 
        backLabel="Dashboard" 
        backHref="/"
      >
        {session.user.role === "ADMIN" && (
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 glass"
          >
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </Link>
          </Button>
        )}
        <SignOutButton />
      </Navigation>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-20">
        {/* Header Section - Kid-Friendly */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-bold text-purple-800 dark:text-purple-200">Your Learning Profile</span>
          </div>
          <h1 className="text-h1 text-gray-900 dark:text-white mb-4">
            All About You! 🎆
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your account and customize your learning experience
          </p>
        </div>

        {/* User Info Card - More Engaging */}
        <div className="bg-white/90 dark:bg-gray-800/90 glass-strong rounded-3xl p-8 border border-white/30 shadow-2xl mb-8 animate-scale-in">
          <div className="flex items-center gap-6 mb-6">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="User Image"
                className="w-24 h-24 border-4 border-gradient-to-r from-blue-500 to-purple-600 rounded-3xl object-cover shadow-xl card-glow"
              />
            ) : (
              <div className="w-24 h-24 border-4 border-white/30 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-xl animate-pulse-glow">
                <span className="uppercase text-2xl font-bold">
                  {session.user.name.slice(0, 2)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-h2 text-gray-900 dark:text-white mb-2">
                {session.user.name} 🌟
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-readable">
                {session.user.email}
              </p>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                  session.user.role === "ADMIN" 
                    ? "bg-gradient-to-r from-red-500 to-pink-600 text-white" 
                    : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                }`}>
                  {session.user.role === "ADMIN" ? "🔥 Admin" : "🎆 Student"}
                </span>
                {session.user.role === "USER" && (
                  <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">
                    🏆 Learner
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                size="sm" 
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              >
                MANAGE OWN POSTS
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                disabled={!FULL_POST_ACCESS.success}
                className={`${
                  FULL_POST_ACCESS.success 
                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                    : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
                }`}
              >
                MANAGE ALL POSTS
              </Button>
            </div>
          </div>
        </div>

        {/* Student Learning Profile */}
        {studentProfile && studentProfile.isOnboarded && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Profile</h3>
                <p className="text-gray-600 dark:text-gray-400">Your personalized learning preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Academic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Academic Info
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Grade Level:</span> {studentProfile.gradeLevel || "Not specified"}
                  </p>
                  {studentProfile.age && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Age:</span> {studentProfile.age}
                    </p>
                  )}
                  {studentProfile.school && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">School:</span> {studentProfile.school}
                    </p>
                  )}
                </div>
              </div>

              {/* Learning Preferences */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  Learning Style
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Style:</span> {formatLearningStyle(studentProfile.learningStyle)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Level:</span> {formatDifficultyLevel(studentProfile.difficultyLevel)}
                  </p>
                  {studentProfile.sessionDuration && (
                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Session:</span> {studentProfile.sessionDuration} minutes
                    </p>
                  )}
                </div>
              </div>

              {/* Goals & Engagement */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Progress
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Engagement:</span> {studentProfile.pastEngagement || 0}%
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(studentProfile.pastEngagement || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects & Interests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Subjects */}
              {studentProfile.subjects && studentProfile.subjects.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    Subjects
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile.subjects.map((subject, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {studentProfile.interests && studentProfile.interests.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile.interests.map((interest, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Learning Goals */}
            {studentProfile.learningGoals && studentProfile.learningGoals.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Learning Goals
                </h4>
                <div className="space-y-2">
                  {studentProfile.learningGoals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update Profile Link */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <Button variant="outline" asChild>
                <Link href="/tutoring" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Update Learning Profile
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Forms Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Update User Form */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Update Profile</h3>
            </div>
            <UpdateUserForm
              name={session.user.name}
              image={session.user.image ?? ""}
            />
          </div>

          {/* Change Password Form */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h3>
            </div>
            <ChangePasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}