"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

const DISABLED_PATHS = ["/kledingkast", "/wasmachinekast"];

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const disabled = DISABLED_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (disabled) return;

    const lenis = new Lenis();

    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [disabled]);

  return <>{children}</>;
}
