import { AuthCallback } from "@/components/auth/AuthCallback";

export default function CallbackPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <AuthCallback />
    </main>
  );
}
