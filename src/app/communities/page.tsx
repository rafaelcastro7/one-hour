"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useLanguage } from "@/app/language-context";

// Communities: themed homes (TimeRepublik-style). Create one, join with
// your email, find your people around a topic.
export default function CommunitiesPage() {
  const { language } = useLanguage();
  const es = language === "es";
  const communities = useQuery(api.communities.list, {});
  const createCommunity = useMutation(api.communities.createCommunity);
  const join = useMutation(api.communities.join);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"tech" | "languages" | "">("");
  const [email, setEmail] = useState("");
  const [joinEmail, setJoinEmail] = useState<Record<string, string>>({});

  async function doCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await createCommunity({
        name,
        description,
        category: category === "" ? undefined : category,
        email: email.trim(),
      });
      setName("");
      setDescription("");
      setMsg(es ? "Comunidad creada. ¡Bienvenido al vecindario!" : "Community created. Welcome to the neighborhood!");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : (es ? "No se pudo crear." : "Couldn't create."));
    }
  }

  async function doJoin(communityName: string) {
    setMsg(null);
    try {
      const r = await join({ name: communityName, email: (joinEmail[communityName] ?? "").trim() });
      setMsg(es ? `Dentro. Ya son ${r.memberCount} miembros.` : `You're in. Now ${r.memberCount} members.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : (es ? "No se pudo unir." : "Couldn't join."));
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl text-center space-y-2">
        <h1 className="text-2xl font-bold">{es ? "Comunidades" : "Communities"}</h1>
        <p className="text-sm text-neutral-400">
          {es
            ? "Encuentra tu gente alrededor de un tema. Crea la tuya o únete con tu correo."
            : "Find your people around a topic. Start your own or join with your email."}
        </p>
      </div>

      {msg && (
        <p className="text-sm text-neutral-300 max-w-md text-center" role="status">{msg}</p>
      )}

      {communities === undefined && <p className="text-neutral-500">{es ? "Cargando..." : "Loading..."}</p>}
      <div className="w-full max-w-2xl grid sm:grid-cols-2 gap-4">
        {communities?.map((c) => (
          <div key={c._id} className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-2">
            <p className="font-semibold">{c.name}</p>
            <p className="text-sm text-neutral-400">{c.description}</p>
            <p className="text-xs text-neutral-500">
              {c.memberCount} {es ? "miembros" : "members"}{c.category ? ` · ${c.category}` : ""}
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
                placeholder={es ? "Tu correo" : "Your email"}
                type="email"
                value={joinEmail[c.name] ?? ""}
                onChange={(e) => setJoinEmail((s) => ({ ...s, [c.name]: e.target.value }))}
              />
              <button
                onClick={() => doJoin(c.name)}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-amber-400 transition-colors"
              >
                {es ? "Unirme" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {communities?.length === 0 && (
        <p className="text-neutral-500 text-sm">{es ? "Aún no hay comunidades. Funda la primera abajo." : "No communities yet. Found the first one below."}</p>
      )}

      <section className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold">{es ? "Funda una comunidad" : "Start a community"}</h2>
        <form onSubmit={doCreate} className="flex flex-col gap-2">
          <input
            className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
            placeholder={es ? "Nombre: Devs noctámbulos" : "Name: Night-owl devs"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
            placeholder={es ? "¿Para qué es? (280)" : "What is it for? (280)"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder={es ? "Tu correo" : "Your email"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as "tech" | "languages" | "")}
              className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm"
            >
              <option value="">{es ? "General" : "General"}</option>
              <option value="tech">Tech</option>
              <option value="languages">{es ? "Idiomas" : "Languages"}</option>
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm">
            {es ? "Crear comunidad" : "Create community"}
          </button>
        </form>
      </section>
    </main>
  );
}
