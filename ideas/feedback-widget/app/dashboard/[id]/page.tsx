import { notFound, redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { WidgetDetailClient } from "./WidgetDetailClient";

export default async function WidgetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: widget } = await supabase
    .from("feedback_widget_widgets")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!widget) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">{widget.question}</h1>
        <p className="mb-6 text-muted">
          created {new Date(widget.created_at).toLocaleDateString()}
        </p>
        <WidgetDetailClient widgetId={widget.id} />
      </main>
    </>
  );
}
