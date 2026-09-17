"use client";

import { useState, useTransition } from "react";
import { toggleBookingPaused } from "../actions";

export default function BookingPauseToggle({ paused: initialPaused }: { paused: boolean }) {
  const [paused, setPaused] = useState(initialPaused);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !paused;
    setPaused(next);
    startTransition(() => {
      toggleBookingPaused(next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${
        paused
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)]"
      }`}
    >
      <span
        className={`inline-block w-9 h-5 rounded-full relative transition-colors ${
          paused ? "bg-red-500" : "bg-[var(--color-teal)]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            paused ? "left-0.5" : "left-4"
          }`}
        />
      </span>
      {paused ? "Agendamentos pausados — clique para reativar" : "Agendamentos ativos — clique para pausar"}
    </button>
  );
}
