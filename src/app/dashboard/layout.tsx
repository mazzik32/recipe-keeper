import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

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
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          user={{
            email: user.email,
            displayName: user.user_metadata?.display_name,
            credits: profile?.credits ?? 0,
            id: user.id, // Pass ID for convenience if needed, though Header uses client supbase
          }}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
