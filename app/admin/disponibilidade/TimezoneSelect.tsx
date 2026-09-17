"use client";

import { updateTimezone } from "../actions";

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (BRT/BRST)" },
  { value: "America/Chicago", label: "EUA — Central (Chicago)" },
  { value: "America/New_York", label: "EUA — Leste (Nova York)" },
  { value: "America/Denver", label: "EUA — Montanha (Denver)" },
  { value: "America/Los_Angeles", label: "EUA — Pacífico (Los Angeles)" },
  { value: "Europe/Lisbon", label: "Portugal (Lisboa)" },
];

export default function TimezoneSelect({ current }: { current: string }) {
  return (
    <select
      defaultValue={current}
      onChange={(e) => updateTimezone(e.target.value)}
      className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]"
    >
      {TIMEZONES.map((tz) => (
        <option key={tz.value} value={tz.value}>
          {tz.label}
        </option>
      ))}
    </select>
  );
}
