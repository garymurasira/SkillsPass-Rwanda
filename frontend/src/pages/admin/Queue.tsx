import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import type { RoundStatus } from "@/lib/api/verification";
import { formatDate } from "@/lib/format";
import { useRounds } from "@/lib/queries/verification";

const tabs = [{ v: "OPEN", l: "admin.queue.open" }, { v: "VERIFIED", l: "admin.queue.verified" }, { v: "NOT_VERIFIED", l: "admin.queue.notVerified" }] as const satisfies readonly { v: RoundStatus; l: string }[];

export default function Queue() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<RoundStatus>("OPEN");
  const q = useRounds(tab);
  const rounds = q.data?.pages.flat() ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.queue.title")}</h1>
      <div className="flex gap-2">
        {tabs.map((x) => (
          <button key={x.v} onClick={() => setTab(x.v)} aria-pressed={tab === x.v} className={`h-11 rounded-full border-2 px-4 font-bold ${tab === x.v ? "border-primary bg-secondary text-primary" : ""}`}>{t(x.l)}</button>
        ))}
      </div>

      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : rounds.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("admin.queue.empty")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-muted text-sm"><tr>{(["worker", "skill", "location", "date", "recorded"] as const).map((h) => <th key={h} className="p-3">{t(`admin.queue.headers.${h}`)}</th>)}</tr></thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/50">
                    <td className="p-3 font-bold"><Link to="/admin/rounds/$id" params={{ id: r.id }} className="text-primary underline">{r.worker.name}</Link></td>
                    <td className="p-3">{r.skill.name}</td>
                    <td className="p-3">{r.worker.region}, {r.worker.city}</td>
                    <td className="p-3">{formatDate(r.createdAt)}</td>
                    <td className="p-3">{t("admin.queue.recorded", { done: r.references.filter((x) => x.result !== "PENDING").length, total: r.references.length })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {q.hasNextPage && (
            <Button variant="outline" className="h-12" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
              {q.isFetchingNextPage ? t("common.loading") : t("common.loadMore")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
