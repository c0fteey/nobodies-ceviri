import { redirect } from "next/navigation";
import { SetupWizard } from "@/components/setup/wizard";
import { ThemeToggle } from "@/components/theme-toggle";
import { getConfig } from "@/lib/config";
import { isSetupCompleteSync } from "@/lib/setup-status";

export default async function SetupPage() {
  if (isSetupCompleteSync()) {
    redirect("/");
  }

  const config = await getConfig();
  if (config.setupCompleted) {
    redirect("/api/setup/restore");
  }

  return (
    <main className="relative min-h-screen px-4 py-10 sm:px-6">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <SetupWizard />
    </main>
  );
}
