import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";

export async function PanelShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={session?.user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
