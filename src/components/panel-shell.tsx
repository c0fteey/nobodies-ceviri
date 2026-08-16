import { Navbar } from "@/components/navbar";
import { auth } from "@/lib/auth";

export async function PanelShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
