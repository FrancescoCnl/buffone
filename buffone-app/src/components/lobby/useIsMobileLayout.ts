import { useEffect, useState } from "react";

// Breakpoint del designer: sotto 760px di larghezza o 480px di altezza
// si passa dal layout ad angoli fissi al flusso verticale scrollabile.
export function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 760 || window.innerHeight < 480
  );

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 760 || window.innerHeight < 480);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

const CORNER_MAPS: Record<number, string[]> = {
  2: ["tl", "tr"],
  3: ["tl", "tr", "bl"],
  4: ["tl", "tr", "bl", "br"],
};

export function cornerClassName(idx: number, numTeams: number, isMobile: boolean): string {
  if (isMobile) {
    return "relative w-[92%] max-w-[420px] mx-auto mb-4";
  }
  const corner = (CORNER_MAPS[numTeams] ?? CORNER_MAPS[4])[idx];
  const base = "fixed w-[228px]";
  switch (corner) {
    case "tl":
      return `${base} top-[18px] left-[18px]`;
    case "tr":
      return `${base} top-[18px] right-[18px]`;
    case "bl":
      return `${base} bottom-[18px] left-[18px]`;
    default:
      return `${base} bottom-[18px] right-[18px]`;
  }
}
