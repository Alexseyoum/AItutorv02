"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BanIcon, RefreshCcwIcon } from "lucide-react";
import { banUserAction, unbanUserAction } from "@/actions/delete-user.action";
import { toast } from "sonner";

interface BanUserButtonProps {
  userId: string;
  isBanned: boolean | null | undefined;
}

export const BanUserButton = ({ userId, isBanned }: BanUserButtonProps) => {
  const [isPending, setIsPending] = useState(false);

  async function handleBan() {
    setIsPending(true);
    const res = await banUserAction({ 
      userId, 
      reason: "Violation of community guidelines" 
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("User banned successfully");
    }
    setIsPending(false);
  }

  async function handleUnban() {
    setIsPending(true);
    const res = await unbanUserAction({ userId });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("User unbanned successfully");
    }
    setIsPending(false);
  }

  return (
    <Button
      size="icon"
      variant={isBanned ? "outline" : "destructive"}
      className="size-7 rounded-sm"
      onClick={isBanned ? handleUnban : handleBan}
      disabled={isPending}
    >
      <span className="sr-only">{isBanned ? "Unban User" : "Ban User"}</span>
      {isBanned ? <RefreshCcwIcon className="h-4 w-4" /> : <BanIcon className="h-4 w-4" />}
    </Button>
  );
};

export const PlaceholderBanUserButton = () => {
  return (
    <Button
      size="icon"
      variant="outline"
      className="size-7 rounded-sm"
      disabled
    >
      <span className="sr-only">Manage Ban Status</span>
      <BanIcon className="h-4 w-4" />
    </Button>
  );
};
