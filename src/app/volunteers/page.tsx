"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { AriaAvatar } from "@/components/AriaAvatar";
import { slotLabel, slotLabelEs } from "@/components/availability";
import { useLanguage } from "@/app/language-context";

export default function VolunteersPage() {
  const { language } = useLanguage();
  const es = language === "es";
  const [category, setCategory] = useState<"all" | "tech" | "languages">("all");
  const volunteers = useQuery(
    api.volunteers.listActive,
    category === "all" ? {} : { category }
  );

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl text-center space-y-2">
        <h1 className="text-2xl font-bold">{es ? "Voluntarios" : "Volunteers"}</h1>
        <p className="text-sm text-neutral-400">
          {es ? (
            <>Gente real (y Aria, nuestra IA de respaldo) regalando una hora. ¿Prefieres que la IA elija? <Link href="/request" className="text-amber-400 underline">Pide ayuda</Link>.</>
          ) : (
            <>Real people (and Aria, our AI fallback) giving an hour. Prefer the AI to choose? <Link href="/request" className="text-amber-400 underline">Request help</Link>.</>
          )}
        </p>
      </div>

      <div className="flex gap-2" role="radiogroup" aria-label={es ? "Filtrar por categoría" : "Filter by category"}>
        {(["all", "tech", "languages"] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={category === c}
            onClick={() => setCategory(c)}
            className={`rounded-lg px-4 py-2 text-sm border capitalize transition-colors ${
              category === c
                ? "bg-amber-400 text-neutral-900 font-semibold border-amber-400"
                : "border-neutral-700 hover:border-amber-400"
            }`}
          >
            {c === "all" ? (es ? "todos" : "all") : c === "languages" && es ? "idiomas" : c}
          </button>
        ))}
      </div>

      {volunteers === undefined && <p className="text-neutral-500">Loading...</p>}
      <div className="w-full max-w-2xl grid sm:grid-cols-2 gap-4">
        {volunteers?.map((v) => (
          <div key={v._id} className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              {v.isVirtual && <AriaAvatar size={40} />}
              <div>
                <p className="font-semibold">{v.name}</p>
                <p className="text-xs text-neutral-500 capitalize">
                  {v.category}
                  {v.skillLevel ? ` · ${v.skillLevel}` : ""}
                  {v.isVirtual ? " · AI" : ""}
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 line-clamp-3">{v.profileSummary}</p>
            {typeof v.ratingCount === "number" && v.ratingCount > 0 && (
              <p className="text-xs text-amber-400">
                ★ {((v.ratingSum ?? 0) / v.ratingCount).toFixed(1)} · {v.ratingCount} session{v.ratingCount > 1 ? "s" : ""}
              </p>
            )}
            {v.slots && v.slots.length > 0 && (
              <p className="text-xs text-neutral-500">
                {es ? "Libre: " : "Free: "}{(es ? v.slots.slice(0, 3).map(slotLabelEs) : v.slots.slice(0, 3).map(slotLabel)).join(" · ")}
                {v.slots.length > 3 ? ` +${v.slots.length - 3} more` : ""}
              </p>
            )}
          </div>
        ))}
      </div>
      {volunteers?.length === 0 && (
        <p className="text-neutral-500">{es ? "Aún no hay voluntarios activos en esta categoría." : "No active volunteers in this category yet."}</p>
      )}
    </main>
  );
}
