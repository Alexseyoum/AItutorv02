"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { toast } from "sonner";
import { OnboardingData, StudentProfile, LEARNING_STYLES, DIFFICULTY_LEVELS } from "@/lib/types";

interface OnboardingWizardProps {
  onComplete: (profile: StudentProfile) => void;
}

const steps = [
  "Basic Information",
  "Academic Interests", 
  "Learning Preferences"
];

const SUBJECTS_OPTIONS = [
  "Mathematics", "Science", "English", "History", "Geography",
  "Physics", "Chemistry", "Biology", "Computer Science", "Art",
  "Music", "Physical Education", "Foreign Languages"
];

const INTERESTS_OPTIONS = [
  "Technology", "Sports", "Music", "Art", "Reading", "Gaming",
  "Science", "History", "Travel", "Cooking", "Movies", "Nature"
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [learningGoalsText, setLearningGoalsText] = useState("");
  const [formData, setFormData] = useState<OnboardingData>({
    gradeLevel: 9,
    age: undefined,
    school: "",
    subjects: [],
    learningGoals: [],
    learningStyle: LEARNING_STYLES.MIXED,
    difficultyLevel: DIFFICULTY_LEVELS.INTERMEDIATE,
    sessionDuration: 30,
    interests: []
  });

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Process learning goals text into array before submitting
      const processedGoals = learningGoalsText
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const submissionData = {
        ...formData,
        learningGoals: processedGoals
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      const data = await response.json();
      
      toast.success("Profile saved successfully!");
      onComplete(data.profile);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="gradeLevel" className="text-base font-medium text-gray-700 dark:text-gray-300">Grade Level *</Label>
              <select
                id="gradeLevel"
                value={formData.gradeLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: parseInt(e.target.value) }))}
                className="w-full mt-2 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="age" className="text-base font-medium text-gray-700 dark:text-gray-300">Age (optional)</Label>
              <Input
                id="age"
                type="number"
                min="5"
                max="25"
                value={formData.age || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="Enter your age"
                className="mt-2 h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="school" className="text-base font-medium text-gray-700 dark:text-gray-300">School (optional)</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                placeholder="Enter your school name"
                className="mt-2 h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium text-gray-700 dark:text-gray-300">Subjects you're studying</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {SUBJECTS_OPTIONS.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      subjects: toggleArrayItem(prev.subjects, subject) 
                    }))}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      formData.subjects.includes(subject)
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="learningGoals" className="text-base font-medium text-gray-700 dark:text-gray-300">Learning Goals</Label>
              <textarea
                id="learningGoals"
                placeholder="What do you want to achieve? (e.g., improve math skills, prepare for exams, understand science better)"
                value={learningGoalsText}
                onChange={(e) => setLearningGoalsText(e.target.value)}
                className="w-full mt-2 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                rows={3}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Separate multiple goals with commas
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium text-gray-700 dark:text-gray-300">How do you learn best?</Label>
              <div className="grid grid-cols-1 gap-3 mt-3">
                {Object.entries(LEARNING_STYLES).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, learningStyle: value }))}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      formData.learningStyle === value
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-medium">{key.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {key === 'VISUAL' && "Pictures, diagrams, and visual aids"}
                      {key === 'AUDITORY' && "Listening and discussing"}
                      {key === 'KINESTHETIC' && "Hands-on activities and movement"}
                      {key === 'READING_WRITING' && "Reading and writing exercises"}
                      {key === 'MIXED' && "Combination of different methods"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium text-gray-700 dark:text-gray-300">Difficulty Level</Label>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {Object.entries(DIFFICULTY_LEVELS).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, difficultyLevel: value }))}
                    className={`p-3 text-center rounded-lg border transition-colors ${
                      formData.difficultyLevel === value
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium text-gray-700 dark:text-gray-300">Your Interests</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {INTERESTS_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      interests: toggleArrayItem(prev.interests, interest) 
                    }))}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      formData.interests.includes(interest)
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-lg" />
      </div>

      <div className="max-w-2xl w-full bg-white/90 dark:bg-gray-800/90 glass-strong rounded-xl shadow-lg border border-white/30 dark:border-gray-700/30 p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Welcome! 🎓</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {steps[currentStep]}
          </h2>
          <p className="text-gray-600 mb-6">
            {currentStep === 0 && "Let's start with some basic information about you"}
            {currentStep === 1 && "Tell us about your academic interests and goals"}
            {currentStep === 2 && "How do you prefer to learn?"}
          </p>
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Saving..." : "Complete Setup 🎉"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}