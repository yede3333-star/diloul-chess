import { LearnTabs } from "@/components/shell/LearnTabs";

export default function LearnLayout({ children }: LayoutProps<"/[locale]/learn">) {
  return (
    <div className="flex flex-col gap-6">
      <LearnTabs />
      {children}
    </div>
  );
}
