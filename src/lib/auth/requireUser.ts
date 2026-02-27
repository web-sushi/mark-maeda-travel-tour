// TODO: Implement middleware to require authenticated user
import { redirect } from "next/navigation";

export async function requireUser() {
  // TODO: Check if user is authenticated
  // TODO: Return user object or redirect to login
  const isAuthenticated = false;
  
  if (!isAuthenticated) {
    redirect("/login");
  }
  
  return { id: "user-id", email: "user@example.com" };
}
