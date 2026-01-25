import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-cream overflow-hidden w-full max-w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full">
        <Header
          user={{
            email: user.email,
            displayName: user.user_metadata?.display_name,
            credits: profile?.credits ?? 0,
            id: user.id,
          }}
        />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden overflow-y-auto min-w-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
