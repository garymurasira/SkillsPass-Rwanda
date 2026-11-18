import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ListChecks } from "lucide-react";
import { adminRounds } from "@/mock/data";
import { EmptyState } from "@/components/EmptyState";
import { StateSwitch, useViewState } from "@/components/ViewState";
import { Button } from "@/components/ui/button";

const tabs = [{ v: "open", l: "Open" }, { v: "verified", l: "Verified" }, { v: "not_verified", l: "Not verified" }];

export default function Queue() {
  const state = useViewState();
  const [tab, setTab] = useState("open");
  const list = adminRounds.filter((r) => r.status === tab);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Verification queue</h1>
      <div className="flex gap-2">{tabs.map((t) => <button key={t.v} onClick={() => setTab(t.v)} className={`h-11 rounded-full border-2 px-4 font-bold ${tab === t.v ? "border-primary bg-secondary text-primary" : ""}`}>{t.l}</button>)}</div>
      <StateSwitch state={state} empty={<EmptyState icon={ListChecks} title="No rounds here" />}>
        {list.length === 0 ? <EmptyState icon={ListChecks} title="No rounds here" /> : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-muted text-sm"><tr>{["Worker", "Skill", "Location", "Date", "Recorded"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/50">
                    <td className="p-3 font-bold"><Link to="/admin/rounds/$id" params={{ id: r.id }} className="text-primary underline">{r.worker.name}</Link></td>
                    <td className="p-3">{r.skill.name}</td>
                    <td className="p-3">{r.worker.region}, {r.worker.city}</td>
                    <td className="p-3">{r.createdAt}</td>
                    <td className="p-3">{r.references.filter((x) => x.recordedAt).length} of 3 recorded</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Button variant="outline" className="h-12" onClick={() => toast("Loading more…")}>Load more</Button>
      </StateSwitch>
    </div>
  );
}
