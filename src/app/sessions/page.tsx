"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useLanguage } from "@/app/language-context";

const STATUS_ES: Record<string, string> = {
  searching: "Buscando",
  match_found: "Match encontrado",
  confirmed: "Confirmada",
  completed: "Completada",
  no_match: "Sin match",
  failed: "Falló",
};

// Sessions portal: one email unlocks both sides — the requests you made and
// the sessions you're hosting as a volunteer. No accounts, no passwords.
export default function SessionsPage() {
  const { language } = useLanguage();
  const es = language === "es";
  const [email, setEmail] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const mine = useQuery(api.requests.listByEmail, activeEmail ? { email: activeEmail } : "skip");
  const hosting = useQuery(api.requests.listByVolunteer, activeEmail ? { email: activeEmail } : "skip");
  const balance = useQuery(api.credits.balanceOf, activeEmail ? { email: activeEmail } : "skip");

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl text-center space-y-2">
        <h1 className="text-2xl font-bold">{es ? "Mis sesiones" : "My sessions"}</h1>
        <p className="text-sm text-neutral-400">
          {es
            ? "Escribe tu correo para ver tus solicitudes y las sesiones que hospedas como voluntario."
            : "Enter your email to see your requests and the sessions you host as a volunteer."}
        </p>
      </div>

      <form
        className="flex gap-2 w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveEmail(email.toLowerCase().trim());
        }}
      >
        <label htmlFor="sessions-email" className="sr-only">Email</label>
        <input
          id="sessions-email"
          type="email"
          className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          placeholder={es ? "tu@correo.com" : "you@email.com"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm"
        >
          {es ? "Ver" : "View"}
        </button>
      </form>

      {activeEmail && (
        <>
          {typeof balance === "number" && (
            <p className="text-sm text-neutral-400">
              {es ? `Balance de tiempo: ${balance}h` : `Time balance: ${balance}h`} ·{" "}
              <Link href="/request" className="text-amber-400 underline">{es ? "Pedir ayuda" : "Request help"}</Link>
            </p>
          )}

          <section className="w-full max-w-2xl space-y-3">
            <h2 className="font-semibold">{es ? "Mis solicitudes" : "My requests"} ({mine?.length ?? 0})</h2>
            {mine === undefined && <p className="text-sm text-neutral-500">{es ? "Cargando..." : "Loading..."}</p>}
            {mine?.length === 0 && (
              <p className="text-sm text-neutral-500">{es ? "Aún no pides ayuda. Cuando lo hagas, aparece aquí." : "No requests yet. When you ask for help, it shows up here."}</p>
            )}
            {mine?.map((r) => (
              <Link
                key={r._id}
                href={`/status/${r._id}`}
                className="block bg-neutral-900 border border-neutral-700 rounded-xl p-4 hover:border-amber-400 transition-colors"
              >
                <div className="flex justify-between items-center gap-2">
                  <p className="font-medium text-sm truncate">{r.needSummary || r.rawNeedPreview}</p>
                  <span className="text-xs text-amber-400 shrink-0">{STATUS_ES[r.status] ?? r.status}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {r.volunteer ? (es ? `con ${r.volunteer.name}` : `with ${r.volunteer.name}`) : (es ? "buscando match…" : "finding a match…")}
                  {typeof r.requesterRating === "number" ? ` · ★ ${r.requesterRating}/5` : ""}
                </p>
              </Link>
            ))}
          </section>

          <section className="w-full max-w-2xl space-y-3">
            <h2 className="font-semibold">{es ? "Sesiones que hospedo" : "Sessions I host"} ({hosting?.length ?? 0})</h2>
            {hosting === undefined && <p className="text-sm text-neutral-500">{es ? "Cargando..." : "Loading..."}</p>}
            {hosting?.length === 0 && (
              <p className="text-sm text-neutral-500">
                {es ? "Nadie te ha emparejado aún. Comparte tu perfil de voluntario." : "Nobody matched with you yet. Share your volunteer profile."}
              </p>
            )}
            {hosting?.map((r) => (
              <div key={r._id} className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 space-y-1">
                <div className="flex justify-between items-center gap-2">
                  <p className="font-medium text-sm">{r.name} <span className="text-neutral-500 font-normal">({r.email})</span></p>
                  <span className="text-xs text-amber-400 shrink-0">{STATUS_ES[r.status] ?? r.status}</span>
                </div>
                <p className="text-xs text-neutral-500">
                  {r.preferredTime}{r.preferredTz ? ` (${r.preferredTz})` : ""}
                </p>
                {r.roomUrl && (
                  <a href={r.roomUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 underline">
                    {es ? "Abrir sala" : "Open room"}
                  </a>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
