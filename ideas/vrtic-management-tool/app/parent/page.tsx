import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { PlaceholderIllustration } from "@/components/PlaceholderIllustration";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  getAttendanceForChild,
  getDailyMenus,
  getGroupsForParent,
  getPhotoPosts,
} from "@/lib/data";

const STATUS_LABEL_SR: Record<string, string> = {
  present: "Prisutan",
  absent: "Odsutan",
  sick: "Bolestan",
  excused: "Opravdano odsutan",
};

/**
 * Parent view. Access is entirely RLS-driven: `getGroupsForParent` just
 * selects from `vrtic_management_tool_children` with the logged-in user's
 * session — the RLS policy (`vrtic_is_parent_of_child`) is what actually
 * limits the result to children whose `child_contacts.parent_email`
 * matches this user's JWT email. No app-level filtering needed here.
 */
export default async function ParentPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const links = await getGroupsForParent(supabase);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Pregled za roditelje</h1>
        <p className="mb-6 text-muted">
          Prijavljeni ste kao <strong>{user.email}</strong>.
        </p>

        {links.length === 0 ? (
          <EmptyState
            title="Nijedno dete nije povezano sa ovim emailom."
            description="Ako mislite da je ovo greška, proverite sa vaspitačem da li je vaš email tačno unet kao kontakt."
          />
        ) : (
          <div className="flex flex-col gap-8">
            {await Promise.all(
              links.map(async ({ group, child }) => {
                const [attendance, menus, photos] = await Promise.all([
                  getAttendanceForChild(supabase, child.id),
                  getDailyMenus(supabase, group.id, 3),
                  getPhotoPosts(supabase, group.id),
                ]);

                return (
                  <section key={child.id}>
                    <GlassPanel glow className="mb-3">
                      <h2 className="text-lg font-semibold">
                        {child.full_name} — {group.name}
                      </h2>
                    </GlassPanel>

                    <h3 className="mb-2 text-sm font-semibold text-muted">
                      Prisustvo (poslednje)
                    </h3>
                    <Card className="mb-4">
                      {attendance.length === 0 ? (
                        <EmptyState title="Još nema evidentiranog prisustva." />
                      ) : (
                        <div className="flex flex-col gap-1 text-sm">
                          {attendance.map((record) => (
                            <div key={record.id} className="flex justify-between">
                              <span>{record.attendance_date}</span>
                              <span className="text-muted">
                                {STATUS_LABEL_SR[record.status] ?? record.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    <h3 className="mb-2 text-sm font-semibold text-muted">Jelovnik</h3>
                    <div className="mb-4 flex flex-col gap-2">
                      {menus.length === 0 ? (
                        <EmptyState title="Još nema unetog jelovnika." />
                      ) : (
                        menus.map((menu, i) => (
                          <AnimatedCard key={menu.id} index={i}>
                            <p className="mb-1 text-sm font-medium">{menu.menu_date}</p>
                            <p className="text-sm text-muted">
                              Doručak: {menu.breakfast || "—"} · Ručak: {menu.lunch || "—"} ·
                              Užina: {menu.snack || "—"}
                            </p>
                          </AnimatedCard>
                        ))
                      )}
                    </div>

                    <h3 className="mb-2 text-sm font-semibold text-muted">Iz vrtića</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {photos.length === 0 ? (
                        <EmptyState title="Još nema objava." />
                      ) : (
                        photos.map((photo, i) => (
                          <AnimatedCard key={photo.id} index={i}>
                            <PlaceholderIllustration placeholderKey={photo.placeholder_key} />
                            <p className="mt-2 text-sm">{photo.caption}</p>
                          </AnimatedCard>
                        ))
                      )}
                    </div>
                  </section>
                );
              }),
            )}
          </div>
        )}
      </main>
    </>
  );
}
