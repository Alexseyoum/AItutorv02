import {
  DeleteUserButton,
  PlaceholderDeleteUserButton,
} from "@/components/delete-user-button";
import { ReturnHomeButton } from "@/components/return-home-button";
import { UserRoleSelect } from "@/components/user-role-select";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type UserRole = "USER" | "ADMIN";

export default async function Page() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) redirect("/auth/login");

  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        {/* Theme Toggle - Fixed position */}
        <div className="fixed top-6 right-6 z-50">
          <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-lg" />
        </div>
        
        <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
          <div className="space-y-4">
            <ReturnHomeButton />

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

            <p className="p-2 rounded-md text-lg bg-red-600 text-white font-bold">
              FORBIDDEN
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { users } = await auth.api.listUsers({
    headers: headersList,
    query: {
      sortBy: "name",
    },
  });

  const sortedUsers = users.sort((a, b) => {
    if (a.role === "ADMIN" && b.role !== "ADMIN") return -1;
    if (a.role !== "ADMIN" && b.role === "ADMIN") return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-lg" />
      </div>
      
      <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
        <div className="space-y-4">
          <ReturnHomeButton />

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

          <p className="p-2 rounded-md text-lg bg-green-600 text-white font-bold">
            ACCESS GRANTED
          </p>
        </div>

        <div className="w-full overflow-x-auto bg-white/90 dark:bg-gray-800/90 glass-strong rounded-xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6">
          <table className="table-auto min-w-full whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600 text-sm text-left">
                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">ID</th>
                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Name</th>
                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Email</th>
                <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Role</th>
                <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-600 text-sm text-left">
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{user.id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{user.name}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-2 text-center">
                    <UserRoleSelect
                      userId={user.id}
                      role={user.role as UserRole}
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    {user.role === "USER" ? (
                      <DeleteUserButton userId={user.id} />
                    ) : (
                      <PlaceholderDeleteUserButton />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}