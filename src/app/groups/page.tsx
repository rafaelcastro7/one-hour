"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "@/app/language-context";
import { TEMPLATES, templateById } from "@/components/templates";
import { PRESETS, PRESET_LABEL_ES, SlotId } from "@/components/availability";
import { slotLabelEs, slotLabel } from "@/components/availability";

// Group sessions: one host, one room, up to N members on a shared template.
// Join with name+email; the room appears on the card once ready.
export default function GroupsPage() {
  const { language } = useLanguage();
  const es = language === "es";
  const [category, setCategory] = useState<"tech" | "languages">("tech");
  const groups = useQuery(api.groups.listOpen, { category });
  const joinGroup = useMutation(api.groups.joinGroup);
  const createGroup = useMutation(api.groups.createGroup);

  const [joinName, setJoinName] = useState<Record<string, string>>({});
  const [joinEmail, setJoinEmail] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const [hostEmail, setHostEmail] = useState("");
  const [hostTitle, setHostTitle] = useState("");
  const [hostTemplate, setHostTemplate] = useState("mock-interview");
  const [hostPreset, setHostPreset] = useState<SlotId[]>([...(PRESETS[0]?.slots ?? [])]);
  const [hostCap, setHostCap] = useState(6);

  async function doJoin(groupId: Id<"groups">) {
    setMsg(null);
    try {
      const r = await joinGroup({
        groupId,
        name: (joinName[groupId] ?? "").trim(),
        email: (joinEmail[groupId] ?? "").trim(),
      });
      setMsg(
        r.ready
          ? es ? "¡Grupo lleno! La sala aparece en la tarjeta en segundos." : "Group full! The room appears on the card in seconds."
          : es ? `Dentro. Quedan ${r.spotsLeft} lugares.` : `You're in. ${r.spotsLeft} spots left.`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : (es ? "No se pudo unir." : "Couldn't join."));
    }
  }

  async function doHost(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await createGroup({
        volunteerEmail: hostEmail.trim(),
        title: hostTitle.trim(),
        category,
        template: hostTemplate,
        slots: hostPreset,
        capacity: hostCap,
      });
      setHostTitle("");
      setMsg(es ? "Grupo creado. Aparece arriba en cuanto abre." : "Group created. It shows up above once open.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : (es ? "No se pudo crear." : "Couldn't create."));
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl text-center space-y-2">
        <h1 className="text-2xl font-bold">{es ? "Sesiones grupales" : "Group sessions"}</h1>
        <p className="text-sm text-neutral-400">
          {es
            ? "Un anfitrión, una sala, varios participantes. Únete con tu nombre y correo."
            : "One host, one room, several members. Join with your name and email."}
        </p>
      </div>

      <div className="flex gap-2" role="radiogroup" aria-label="Category">
        {(["tech", "languages"] as const).map((c) => (
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
            {c === "languages" && es ? "idiomas" : c}
          </button>
        ))}
      </div>

      {msg && (
        <p className="text-sm text-neutral-300 max-w-md text-center" role="status">{msg}</p>
      )}

      {groups === undefined && <p className="text-neutral-500">{es ? "Cargando..." : "Loading..."}</p>}
      <div className="w-full max-w-2xl grid sm:grid-cols-2 gap-4">
        {groups?.map((g) => (
          <div key={g._id} className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-2">
            <p className="font-semibold">{g.title}</p>
            <p className="text-xs text-neutral-500">
              {es ? "Anfitrión" : "Host"}: {g.hostName} · {templateById(g.template)?.[es ? "labelEs" : "label"] ?? g.template} · {g.spotsLeft} {es ? "lugares" : "spots left"}
            </p>
            <p className="text-xs text-neutral-500">
              {es ? "Horario" : "Slots"}: {(es ? g.slots.slice(0, 3).map(slotLabelEs) : g.slots.slice(0, 3).map(slotLabel)).join(" · ")}
            </p>
            {g.roomUrl ? (
              <a href={g.roomUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm">
                {es ? "Unirse a la sala" : "Join the room"}
              </a>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <input
                  className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  placeholder={es ? "Tu nombre" : "Your name"}
                  value={joinName[g._id] ?? ""}
                  onChange={(e) => setJoinName((s) => ({ ...s, [g._id]: e.target.value }))}
                />
                <input
                  className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  placeholder={es ? "Tu correo" : "Your email"}
                  type="email"
                  value={joinEmail[g._id] ?? ""}
                  onChange={(e) => setJoinEmail((s) => ({ ...s, [g._id]: e.target.value }))}
                />
                <button
                  onClick={() => doJoin(g._id)}
                  className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-amber-400 transition-colors"
                >
                  {es ? "Unirme al grupo" : "Join group"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {groups?.length === 0 && (
        <p className="text-neutral-500 text-sm">{es ? "Sin grupos abiertos en esta categoría. Hospeda el primero abajo." : "No open groups in this category. Host the first one below."}</p>
      )}

      <section className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold">{es ? "Hospeda un grupo" : "Host a group"}</h2>
        <p className="text-xs text-neutral-500">{es ? "Solo voluntarios activos y verificados." : "Active, verified volunteers only."}</p>
        <form onSubmit={doHost} className="flex flex-col gap-2">
          <input
            className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
            placeholder={es ? "Tu correo de voluntario" : "Your volunteer email"}
            type="email"
            value={hostEmail}
            onChange={(e) => setHostEmail(e.target.value)}
          />
          <input
            className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
            placeholder={es ? "Título: repaso de CV para devs junior" : "Title: resume review for junior devs"}
            value={hostTitle}
            onChange={(e) => setHostTitle(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.filter((t) => t.category === "either" || t.category === category).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setHostTemplate(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${
                  hostTemplate === t.id
                    ? "bg-amber-400 text-neutral-900 font-semibold border-amber-400"
                    : "border-neutral-700 hover:border-amber-400"
                }`}
              >
                {es ? t.labelEs : t.label}
              </button>
            ))}
          </div>
          <label className="text-xs text-neutral-400 flex items-center gap-2">
            {es ? "Cupo" : "Capacity"}:
            <input
              type="number"
              min={2}
              max={12}
              value={hostCap}
              onChange={(e) => setHostCap(Number(e.target.value))}
              className="w-16 rounded-lg bg-neutral-950 border border-neutral-700 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Slots">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={hostPreset.length > 0 && p.slots.every((s) => hostPreset.includes(s)) && hostPreset.every((s) => p.slots.includes(s))}
                onClick={() => setHostPreset([...p.slots])}
                className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${
                  p.slots.every((s) => hostPreset.includes(s)) && hostPreset.every((s) => p.slots.includes(s))
                    ? "bg-amber-400 text-neutral-900 font-semibold border-amber-400"
                    : "border-neutral-700 hover:border-amber-400"
                }`}
              >
                {es ? PRESET_LABEL_ES[p.id] : p.label}
              </button>
            ))}
          </div>
          <button type="submit" className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm">
            {es ? "Crear grupo" : "Create group"}
          </button>
        </form>
      </section>
    </main>
  );
}
