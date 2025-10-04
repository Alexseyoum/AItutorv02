"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/actions/change-password.action";
import { toast } from "sonner";

export const ChangePasswordForm = () => {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const formData = new FormData(evt.target as HTMLFormElement);

    setIsPending(true);

    const { error } = await changePasswordAction(formData);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Password changed successfully");
      (evt.target as HTMLFormElement).reset();
    }

    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300 font-medium">
          Current Password
        </Label>
        <Input 
          type="password" 
          id="currentPassword" 
          name="currentPassword" 
          className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
          placeholder="Enter current password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300 font-medium">
          New Password
        </Label>
        <Input 
          type="password" 
          id="newPassword" 
          name="newPassword" 
          className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
          placeholder="Enter new password"
        />
      </div>

      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isPending ? "Changing Password..." : "Change Password"}
      </Button>
    </form>
  );
};