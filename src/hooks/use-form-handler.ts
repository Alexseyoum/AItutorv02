"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VALIDATION_MESSAGES, REDIRECT_DELAY } from "@/lib/constants";

interface UseFormHandlerOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  redirectTo?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormHandler(options: UseFormHandlerOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    submitFn: (formData: FormData) => Promise<any>,
    requiredFields: string[] = []
  ) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    
    // Validate required fields
    const missingFields = requiredFields.filter(field => !formData.get(field));
    if (missingFields.length > 0) {
      toast.error(VALIDATION_MESSAGES.REQUIRED_FIELDS);
      setIsLoading(false);
      return;
    }

    try {
      const result = await submitFn(formData);

      if (result.error) {
        toast.error(result.error.message || options.errorMessage || "Operation failed");
        options.onError?.(result.error);
      } else {
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        (event.target as HTMLFormElement).reset();
        options.onSuccess?.(result);
        
        if (options.redirectTo) {
          setTimeout(() => {
            router.push(options.redirectTo!);
          }, REDIRECT_DELAY);
        }
      }
    } catch (error) {
      toast.error(options.errorMessage || "An unexpected error occurred");
      console.error("Form submission error:", error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSubmit
  };
}