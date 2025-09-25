"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      // Safe JSON parsing - check if response has content first
      let data = null;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (jsonError) {
            console.error("JSON parse error:", jsonError);
          }
        }
      }

      if (response.ok) {
        toast.success("Registration successful!");
        (event.target as HTMLFormElement).reset();
      } else {
        const errorMessage = data?.error || data?.message || `Registration failed (Status: ${response.status})`;
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("An error occurred during registration");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <Input 
          id="name" 
          name="name" 
          type="text" 
          required 
          disabled={isLoading}
          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
          placeholder="Enter your full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input 
          type="email" 
          id="email" 
          name="email" 
          required 
          disabled={isLoading}
          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
          placeholder="Enter your email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <Input 
          type="password" 
          id="password" 
          name="password" 
          required 
          disabled={isLoading}
          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
          placeholder="Create a strong password"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" 
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Creating Account...</span>
          </div>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
};