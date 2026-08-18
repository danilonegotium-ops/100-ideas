import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  getProjectById,
  getProjectClients,
  getProjectFiles,
  getProjectUpdates,
  getSignedFileUrl,
} from "@/lib/data";
import { inviteClient, postUpdate, uploadFile } from "@/lib/actions";

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  // RLS (`scp_is_project_member`) already restricts this to projects the
  // logged-in user actually belongs to — a null result means either the
  // project doesn't exist or this user isn't a member, and either way
  // notFound() is the right response (doesn't leak which).
  const project = await getProjectById(supabase, params.projectId);
  if (!project) notFound();

  const isFreelancer = project.freelancer_id === user.id;

  const [clients, updates, files] = await Promise.all([
    isFreelancer ? getProjectClients(supabase, project.id) : Promise.resolve([]),
    getProjectUpdates(supabase, project.id),
    getProjectFiles(supabase, project.id),
  ]);

  const filesWithUrls = await Promise.all(
    files.map(async (file) => ({
      file,
      url: await getSignedFileUrl(supabase, file.storage_path),
    })),
  );

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">{project.name}</h1>
        {project.description && <p className="mb-6 text-muted">{project.description}</p>}

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        {isFreelancer && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Klijenti</h2>
            <Card className="mb-3">
              {clients.length === 0 ? (
                <p className="text-sm text-muted">Još niste pozvali klijenta.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {clients.map((client) => (
                    <li key={client.id}>{client.client_email}</li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-muted">Pozovi klijenta</h3>
              <form
                action={inviteClient.bind(null, project.id)}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="flex-1">
                  <label htmlFor="client_email">Email klijenta</label>
                  <input id="client_email" name="client_email" type="email" required />
                </div>
                <Button type="submit">Pozovi</Button>
              </form>
              <p className="mt-2 text-xs text-muted">
                Klijent dobija pristup čim se prijavi (magic link) sa ovim istim emailom — nema
                posebnu lozinku.
              </p>
            </Card>
          </section>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Napredak</h2>
          <div className="mb-3 flex flex-col gap-3">
            {updates.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">Još nema objava.</p>
              </Card>
            ) : (
              updates.map((update) => (
                <Card key={update.id}>
                  <p className="text-sm">{update.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(update.created_at).toLocaleString("sr-RS")}
                  </p>
                </Card>
              ))
            )}
          </div>
          {isFreelancer && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-muted">Nova objava</h3>
              <form action={postUpdate.bind(null, project.id)} className="flex flex-col gap-3">
                <textarea name="body" rows={3} required placeholder="Šta je novo na projektu?" />
                <div>
                  <Button type="submit">Objavi</Button>
                </div>
              </form>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Fajlovi</h2>
          <div className="mb-3 flex flex-col gap-2">
            {filesWithUrls.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">Još nema otpremljenih fajlova.</p>
              </Card>
            ) : (
              filesWithUrls.map(({ file, url }) => (
                <Card key={file.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{file.file_name}</p>
                    <p className="text-xs text-muted">{formatBytes(file.size_bytes)}</p>
                  </div>
                  {url ? (
                    <a href={url} className="text-sm text-accent hover:text-accent-strong">
                      Preuzmi
                    </a>
                  ) : (
                    <span className="text-xs text-muted">nedostupno</span>
                  )}
                </Card>
              ))
            )}
          </div>
          {isFreelancer && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-muted">Otpremi fajl</h3>
              <form
                action={uploadFile.bind(null, project.id)}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="file" name="file" required className="flex-1" />
                <Button type="submit">Otpremi</Button>
              </form>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}
