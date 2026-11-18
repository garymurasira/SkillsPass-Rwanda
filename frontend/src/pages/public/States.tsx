const groups: { title: string; path: string; states: string[] }[] = [
  { title: "Worker profile", path: "/worker", states: ["loading", "error", "empty"] },
  { title: "Worker verify (form / status)", path: "/worker/verify", states: ["form", "status", "empty", "loading", "error"] },
  { title: "Worker jobs", path: "/worker/jobs", states: ["empty", "loading", "error"] },
  { title: "Worker ratings", path: "/worker/ratings", states: ["empty", "loading", "error"] },
  { title: "Worker messages", path: "/worker/messages", states: ["empty", "loading", "error"] },
  { title: "Employer find", path: "/employer", states: ["empty", "loading", "error"] },
  { title: "Employer favorites", path: "/employer/favorites", states: ["empty", "loading", "error"] },
  { title: "Employer jobs", path: "/employer/jobs", states: ["empty", "loading", "error"] },
  { title: "Employer messages", path: "/employer/messages", states: ["empty", "loading", "error"] },
  { title: "Worker detail", path: "/employer/workers/w1", states: ["loading", "error"] },
  { title: "Admin queue", path: "/admin", states: ["empty", "loading", "error"] },
  { title: "Admin flagged", path: "/admin/flagged", states: ["empty", "loading", "error"] },
];

const extras = [
  ["Worker detail: shared phone (Call button)", "/employer/workers/w1"],
  ["Worker detail: no longer available", "/employer/workers/gone"],
  ["Admin round: open", "/admin/rounds/ar1"],
  ["Admin round: closed", "/admin/rounds/ar2"],
];

export default function States() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5">
      <h1 className="text-2xl font-bold">Preview states</h1>
      <ul className="space-y-4">
        {groups.map((g) => (
          <li key={g.path} className="rounded-2xl border p-4">
            <p className="font-bold">{g.title}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={g.path} className="rounded-full bg-secondary px-3 py-2 text-sm font-bold text-primary">default</a>
              {g.states.map((s) => (
                <a key={s} href={`${g.path}?state=${s}`} className="rounded-full bg-muted px-3 py-2 text-sm font-bold">{s}</a>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <ul className="space-y-2">
        {extras.map(([l, h]) => <li key={h}><a href={h} className="font-bold text-primary underline">{l}</a></li>)}
      </ul>
    </div>
  );
}
