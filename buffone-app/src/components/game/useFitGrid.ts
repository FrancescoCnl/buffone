import { useEffect, useRef, useState } from "react";

const CARD_RATIO = 16 / 9;

/**
 * Calcola la dimensione di carta più grande (mantenendo sempre 16:9) che fa
 * stare l'intera griglia cols×rows nello spazio disponibile del contenitore,
 * senza mai deformare le carte né tagliare la griglia.
 */
export function useFitGrid(cols: number, rows: number, gapPx: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const availW = Math.max(0, size.width - gapPx * (cols - 1));
  const availH = Math.max(0, size.height - gapPx * (rows - 1));

  let cardWidth = availW / cols;
  let cardHeight = cardWidth / CARD_RATIO;
  if (cardHeight * rows > availH) {
    cardHeight = availH / rows;
    cardWidth = cardHeight * CARD_RATIO;
  }

  return {
    containerRef,
    cardWidth: Math.max(0, cardWidth),
    cardHeight: Math.max(0, cardHeight),
  };
}
