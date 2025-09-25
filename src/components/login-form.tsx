"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FormField } from "@/components/ui/form-field";
import { authClient } from "@/lib/auth-client";
import { useFormHandler } from "@/hooks/use-form-handler";
import { BUTTON_STYLES, VALIDATION_MESSAGES } from "@/lib/constants";

export const LoginForm = () => {
  const { isLoading, handleSubmit } = useFormHandler({
    redirectTo: "/profile",
    successMessage: VALIDATION_MESSAGES.LOGIN_SUCCESS,
    errorMessage: VALIDATION_MESSAGES.LOGIN_ERROR
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(
      event,
      async (formData) => {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        
        return await authClient.signIn.email({ email, password });
      },
      ["email", "password"]
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormField
        id="email"
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        required
        disabled={isLoading}
      />

      <FormField
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        required
        disabled={isLoading}
      />

      <Button 
        type="submit" 
        className={BUTTON_STYLES.primary}
        disabled={isLoading}
      >
        {isLoading ? (
          <LoadingSpinner text="Signing In..." />
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
};