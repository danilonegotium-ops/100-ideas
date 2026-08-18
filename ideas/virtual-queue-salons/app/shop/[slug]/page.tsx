import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { QueueJoinClient } from "@/components/queue/QueueJoinClient";

export default async function ShopQueuePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: shop } = await supabase
    .from("virtual_queue_salons_shops")
    .select("id, slug, name")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!shop) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">{shop.name}</h1>
        <p className="mb-6 text-sm text-muted">Join the waitlist — no need to wait inside.</p>
        <QueueJoinClient shopId={shop.id} shopName={shop.name} />
      </main>
    </>
  );
}
