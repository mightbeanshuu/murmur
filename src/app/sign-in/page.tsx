import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthForm } from "@/components/AuthForm";
import { auth } from "@/lib/auth";

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <main className="murmur-auth-page">
      <AuthForm />
    </main>
  );
}
