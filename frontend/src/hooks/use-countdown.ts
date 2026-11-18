import { useCallback, useEffect, useState } from "react";

/** Counts down from `seconds` to 0. `restart()` begins again (used for "Resend code in 60s"). */
export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const restart = useCallback(() => setLeft(seconds), [seconds]);
  return { left, restart };
}
