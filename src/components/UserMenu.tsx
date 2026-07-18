"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();

  return (
    <div className="murmur-user">
      <div>
        <strong>{name}</strong>
        <span>{email}</span>
      </div>
      <button
        onClick={async () => {
          await authClient.signOut();
          router.push("/sign-in");
          router.refresh();
        }}
      >
        Sign out
      </button>
    </div>
  );
}
