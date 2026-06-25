import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-info")({
  head: () => ({ meta: [{ title: "Admin access · Fox Rides" }] }),
  component: Info,
});

function Info() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-2xl font-black">Admin access</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Admin privileges are granted from the database. After signing up, run the
          following in the Cloud SQL editor with your <code className="rounded bg-muted px-1">user_id</code>:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-foreground p-4 text-xs text-background">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID', 'admin');`}
        </pre>
        <p className="mt-3 text-xs text-muted-foreground">Then refresh and the Admin tab appears in the bottom nav.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">← Back home</Link>
      </div>
    </div>
  );
}
