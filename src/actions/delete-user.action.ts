"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function banUserAction({ 
  userId, 
  reason = "Violation of terms", 
  expiresAt = null 
}: { 
  userId: string; 
  reason?: string; 
  expiresAt?: Date | null;
}) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "ADMIN" || session.user.id === userId) {
    throw new Error("Forbidden");
  }

  try {
    await prisma.user.update({
      where: {
        id: userId,
        role: "USER",
      },
      data: {
        banned: true,
        banReason: reason,
        banExpires: expiresAt
      }
    });

    if (session.user.id === userId) {
      await auth.api.signOut({ headers: headersList });
      redirect("/auth/sign-in");
    }

    revalidatePath("/dashboard/admin");
    return { success: true, error: null };
  } catch (err) {
    if (err instanceof APIError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Internal Server Error" };
  }
}

export async function unbanUserAction({ userId }: { userId: string }) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        banned: false,
        banReason: null,
        banExpires: null
      }
    });

    revalidatePath("/dashboard/admin");
    return { success: true, error: null };
  } catch (err) {
    if (err instanceof APIError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Internal Server Error" };
  }
}
