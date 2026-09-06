"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function AdminPage() {
  const pending = useQuery(api.volunteers.pendingApproval);
  const approve = useMutation(api.volunteers.approve);

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-6 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">Aprobación de voluntarios</h1>
      <p className="text-sm text-neutral-400 max-w-md text-center">
        Gate manual humano: verificá que cada persona sea quien dice ser antes
        de activarla, especialmente en categorías sensibles.
      </p>

      <div className="w-full max-w-2xl flex flex-col gap-4">
        {pending === undefined && <p className="text-neutral-500">Cargando...</p>}
        {pending?.length === 0 && (
          <p className="text-neutral-500">No hay voluntarios pendientes.</p>
        )}
        {pending?.map((v) => (
          <div
            key={v._id}
            className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 flex justify-between items-start gap-4"
          >
            <div>
              <p className="font-semibold">
                {v.name} <span className="text-xs text-neutral-500">({v.category})</span>
              </p>
              <p className="text-sm text-neutral-400">{v.email}</p>
              <p className="text-sm text-neutral-300 mt-2">{v.profileSummary || v.rawOffer}</p>
            </div>
            <button
              onClick={() => approve({ volunteerId: v._id as Id<"volunteers"> })}
              className="shrink-0 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm"
            >
              Aprobar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
