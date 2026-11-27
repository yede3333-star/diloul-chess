import { BottomNav } from "@/components/shell/BottomNav";
import { TopBar } from "@/components/shell/TopBar";

export default function TabsLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <TopBar />
      <BottomNav />
      <div className="lg:ps-56">
        <main className="mx-auto w-full max-w-[880px] px-[max(16px,env(safe-area-inset-left))] pt-5 pb-[calc(env(safe-area-inset-bottom)+190px)] lg:pb-32">
          {children}
        </main>
      </div>
    </>
  );
}
