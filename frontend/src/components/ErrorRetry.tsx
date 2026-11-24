import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type Props = {
  text?: string;
  /** Pass the query's refetch. */
  onRetry: () => void;
};

export function ErrorRetry({ text, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" role="alert">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
        <WifiOff className="h-10 w-10" />
      </div>
      <p className="max-w-xs font-bold">{text ?? t("common.somethingWrongInternet")}</p>
      <Button size="lg" className="h-12 px-8" onClick={onRetry}>{t("common.tryAgain")}</Button>
    </div>
  );
}
