import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PlaceholderIllustration } from "@/components/PlaceholderIllustration";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  buildAttendanceGrid,
  getAttendanceForGroup,
  getChildContactsByChildIds,
  getChildren,
  getDailyMenus,
  getGroupById,
  getPhotoPosts,
  lastNDates,
} from "@/lib/data";
import { addChild, addPhotoPost, markAttendance, upsertDailyMenu } from "@/lib/actions";
import { PLACEHOLDER_KEYS, type AttendanceStatus } from "@/lib/types";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "P",
  absent: "O",
  sick: "B",
  excused: "I",
};

export default async function GroupDashboardPage({
  params,
  searchParams,
}: {
  params: { groupId: string };
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const group = await getGroupById(supabase, params.groupId);
  if (!group || group.teacher_id !== user.id) notFound();

  const dates = lastNDates(7);
  const [children, attendance, menus, photos] = await Promise.all([
    getChildren(supabase, group.id),
    getAttendanceForGroup(supabase, group.id, dates[0]),
    getDailyMenus(supabase, group.id),
    getPhotoPosts(supabase, group.id),
  ]);
  const contacts = await getChildContactsByChildIds(
    supabase,
    children.map((c) => c.id),
  );
  const grid = buildAttendanceGrid(attendance);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-6 text-2xl font-semibold">{group.name}</h1>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Deca ({children.length})</h2>
          <Card className="mb-3 overflow-x-auto">
            {children.length === 0 ? (
              <p className="text-sm text-muted">Još nema dodate dece.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="pb-2 pr-2">Ime</th>
                    {dates.map((d) => (
                      <th key={d} className="pb-2 px-1 text-center font-normal">
                        {d.slice(5)}
                      </th>
                    ))}
                    <th className="pb-2 pl-2">Obeleži danas</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => {
                    const contact = contacts.get(child.id);
                    const childGrid =
                      grid.get(child.id) ?? new Map<string, (typeof attendance)[number]>();
                    return (
                      <tr key={child.id} className="border-t border-border">
                        <td className="py-2 pr-2">
                          <div>{child.full_name}</div>
                          {contact?.parent_email && (
                            <div className="text-xs text-muted">{contact.parent_email}</div>
                          )}
                        </td>
                        {dates.map((d) => {
                          const record = childGrid.get(d);
                          return (
                            <td key={d} className="px-1 text-center text-muted">
                              {record ? STATUS_LABEL[record.status] : "—"}
                            </td>
                          );
                        })}
                        <td className="py-2 pl-2">
                          <form
                            action={markAttendance.bind(null, group.id, child.id)}
                            className="flex items-center gap-1"
                          >
                            <input type="hidden" name="attendance_date" value={today} />
                            <select name="status" defaultValue="present" className="!w-auto text-xs">
                              <option value="present">Prisutan</option>
                              <option value="absent">Odsutan</option>
                              <option value="sick">Bolestan</option>
                              <option value="excused">Opravdano</option>
                            </select>
                            <Button type="submit" variant="secondary" className="!px-2 !py-1 text-xs">
                              Snimi
                            </Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
          <p className="mb-3 text-xs text-muted">
            P = prisutan, O = odsutan, B = bolestan, I = opravdano izostanak
          </p>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Dodaj dete</h3>
            <form
              action={addChild.bind(null, group.id)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div>
                <label htmlFor="full_name">Ime i prezime</label>
                <input id="full_name" name="full_name" required />
              </div>
              <div>
                <label htmlFor="birth_date">Datum rođenja</label>
                <input id="birth_date" name="birth_date" type="date" />
              </div>
              <div>
                <label htmlFor="parent_name">Ime roditelja</label>
                <input id="parent_name" name="parent_name" placeholder="opciono" />
              </div>
              <div>
                <label htmlFor="parent_email">Email roditelja</label>
                <input id="parent_email" name="parent_email" type="email" placeholder="opciono" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Dodaj dete</Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Dnevni jelovnik</h2>
          <div className="mb-3 flex flex-col gap-3">
            {menus.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">Još nema unetog jelovnika.</p>
              </Card>
            ) : (
              menus.map((menu) => (
                <Card key={menu.id}>
                  <h3 className="mb-1 font-medium">{menu.menu_date}</h3>
                  <p className="text-sm text-muted">
                    Doručak: {menu.breakfast || "—"} · Ručak: {menu.lunch || "—"} · Užina:{" "}
                    {menu.snack || "—"}
                  </p>
                </Card>
              ))
            )}
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Unesi jelovnik za dan</h3>
            <form action={upsertDailyMenu.bind(null, group.id)} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="menu_date">Datum</label>
                <input id="menu_date" name="menu_date" type="date" defaultValue={today} />
              </div>
              <div />
              <div>
                <label htmlFor="breakfast">Doručak</label>
                <input id="breakfast" name="breakfast" />
              </div>
              <div>
                <label htmlFor="lunch">Ručak</label>
                <input id="lunch" name="lunch" />
              </div>
              <div>
                <label htmlFor="snack">Užina</label>
                <input id="snack" name="snack" />
              </div>
              <div className="flex items-end">
                <Button type="submit">Sačuvaj jelovnik</Button>
              </div>
            </form>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Objave za roditelje</h2>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            {photos.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">Još nema objava.</p>
              </Card>
            ) : (
              photos.map((photo) => (
                <Card key={photo.id}>
                  <PlaceholderIllustration placeholderKey={photo.placeholder_key} />
                  <p className="mt-2 text-sm">{photo.caption}</p>
                </Card>
              ))
            )}
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Nova objava</h3>
            <form action={addPhotoPost.bind(null, group.id)} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="caption">Opis</label>
                <input id="caption" name="caption" required placeholder="npr. Igra u dvorištu" />
              </div>
              <div>
                <label htmlFor="placeholder_key">Ilustracija</label>
                <select id="placeholder_key" name="placeholder_key" defaultValue={PLACEHOLDER_KEYS[0]}>
                  {PLACEHOLDER_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Objavi</Button>
              </div>
            </form>
          </Card>
        </section>
      </main>
    </>
  );
}
