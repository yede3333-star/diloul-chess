import { BottomNav } from "@/components/shell/BottomNav";
import { GuestReminder } from "@/components/shell/GuestReminder";
import { OnboardingGate } from "@/components/shell/OnboardingGate";
import { TopBar } from "@/components/shell/TopBar";

export default function TabsLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <OnboardingGate />
      <TopBar />
      <BottomNav />
      <div className="lg:ps-56">
        <main className="mx-auto w-full max-w-[880px] px-[max(16px,env(safe-area-inset-left))] pt-5 pb-[calc(env(safe-area-inset-bottom)+190px)] lg:pb-32">
          <div className="flex flex-col gap-4">
            <GuestReminder />
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
