"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { BUTTON_STYLES, VALIDATION_MESSAGES } from "@/lib/constants";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success(VALIDATION_MESSAGES.SIGNOUT_SUCCESS);
            router.push("/");
          },
          onError: (ctx) => {
            console.error("Sign out error:", ctx.error);
            toast.error(VALIDATION_MESSAGES.SIGNOUT_FAILED);
          },
        },
      });
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error(VALIDATION_MESSAGES.SIGNOUT_ERROR);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Welcome, {user.name} 👋
        </h2>
        <p className="text-gray-600">{user.email}</p>
      </div>

      <Button
        onClick={handleSignOut}
        variant="destructive"
        className={BUTTON_STYLES.destructive}
      >
        Sign Out
      </Button>
    </div>
  );
}