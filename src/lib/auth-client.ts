import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields, adminClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { ac, roles } from "@/lib/permissions";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001/api/auth",
     plugins: [inferAdditionalFields<typeof auth>(), adminClient({ ac, roles })],
})

export const {
     signIn,
     signUp, 
     signOut, 
     useSession, 
     admin, 
     sendVerificationEmail,
     forgetPassword,
     resetPassword,
     updateUser,

    } = authClient;