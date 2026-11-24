import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import { useClearFlag, useFlaggedSkills } from "@/lib/queries/verification";

const statusKey = { VERIFIED: "common.skillStatus.verified", PENDING: "common.skillStatus.pending", NOT_VERIFIED: "common.skillStatus.notVerified" } as const;

export default function Flagged() {
  const { t } = useTranslation();
  const q = useFlaggedSkills();
  const clear = useClearFlag();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.flagged.title")}</h1>
      <p className="text-muted-foreground">{t("admin.flagged.text")}</p>
      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState icon={Flag} title={t("admin.flagged.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-muted text-sm"><tr>{(["worker", "skill", "years", "status", ""] as const).map((h, i) => <th key={i} className="p-3">{h && t(`admin.flagged.headers.${h}`)}</th>)}</tr></thead>
            <tbody>{q.data.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 font-bold">{f.worker.name}</td><td className="p-3">{f.skill}</td><td className="p-3">{f.yearsOfExperience}</td>
                <td className="p-3"><span className="rounded-full bg-destructive/10 px-2 py-1 text-sm font-bold text-destructive">{t("admin.flagged.needsReview", { status: t(statusKey[f.status]) })}</span></td>
                <td className="p-3">
                  <Button variant="outline" disabled={clear.isPending} onClick={() => clear.mutate(f.id, { onSuccess: () => toast.success(t("admin.flagged.cleared")), onError: (e) => toast.error(errorMessage(e)) })}>{t("admin.flagged.clear")}</Button>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
