"use client";

import { useEffect } from "react";

// Deux comportements au curseur et au défilement, sans rien rendre :
//  - [data-reveal] : l'élément apparaît (fondu + montée) quand il entre dans l'écran,
//    les éléments qui arrivent ensemble s'enchaînent avec un léger décalage ;
//  - [data-tilt] : l'élément s'incline vers le curseur (souris seulement).
// Tout ce que le CSS cache ou incline est dans un bloc prefers-reduced-motion:
// no-preference ; ici on sort tout de suite si l'utilisateur a demandé moins de mouvement.
// Les pages changent sans rechargement : un MutationObserver prend les éléments
// qui arrivent après coup.
// Ces éléments sont posés sans état « visible » par React ; ici on leur ajoute une classe et un
// décalage. La page est dans un Suspense (loading.tsx) : elle peut s'hydrater APRÈS ce premier
// passage. Les éléments portent donc suppressHydrationWarning, sinon React signale en
// développement que le HTML du serveur ne correspond plus (la classe ajoutée est conservée).
const STEP_MS = 70;
const MAX_TILT = 7;

export function Motion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // --- Apparition au défilement
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            const delay = i * STEP_MS;
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add("is-visible");
            io.unobserve(el);
            // Le décalage ne vaut que pour l'apparition : laissé en place il retarderait
            // aussi tous les survols de l'élément.
            window.setTimeout(() => {
              el.style.transitionDelay = "";
            }, delay + 700);
          });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    const scan = () => {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    let scanFrame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(scanFrame);
      scanFrame = requestAnimationFrame(scan);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    // --- Inclinaison vers le curseur (pointeurs précis uniquement)
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let current: HTMLElement | null = null;
    let tiltFrame = 0;
    const reset = (el: HTMLElement | null) => {
      el?.style.setProperty("--tilt-x", "0deg");
      el?.style.setProperty("--tilt-y", "0deg");
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (el !== current) {
        reset(current);
        current = el;
      }
      if (!el) return;
      const { clientX, clientY } = e;
      cancelAnimationFrame(tiltFrame);
      tiltFrame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const nx = ((clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((clientY - rect.top) / rect.height - 0.5) * 2;
        el.style.setProperty("--tilt-x", `${(-ny * MAX_TILT).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(nx * MAX_TILT).toFixed(2)}deg`);
      });
    };
    const onLeave = (e: PointerEvent) => {
      if (current && !current.contains(e.relatedTarget as Node | null)) {
        cancelAnimationFrame(tiltFrame);
        reset(current);
        current = null;
      }
    };
    if (fine) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerout", onLeave, { passive: true });
    }

    return () => {
      io.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(scanFrame);
      cancelAnimationFrame(tiltFrame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
    };
  }, []);

  return null;
}
