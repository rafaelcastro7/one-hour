"use client";

import { useMutation, useQuery } from "convex/react";
import { use } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function EstadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const request = useQuery(api.requests.get, { requestId: id as Id<"requests"> });
  const confirmMatch = useMutation(api.requests.confirmMatch);

  if (request === undefined) {
    return <Centered>Cargando...</Centered>;
  }

  if (request === null) {
    return <Centered>No encontramos esa solicitud.</Centered>;
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-6 bg-neutral-950 text-neutral-50 text-center">
      {request.status === "buscando" && (
        <>
          <Spinner />
          <p className="text-lg">Buscando a la persona correcta para vos...</p>
          <p className="text-sm text-neutral-500 max-w-sm">{request.needSummary}</p>
        </>
      )}

      {request.status === "sin_match" && (
        <>
          <p className="text-lg">No encontramos a nadie disponible ahora mismo.</p>
          <p className="text-sm text-neutral-500 max-w-sm">
            {request.matchReasoning ?? "Probá de nuevo más tarde, seguimos sumando voluntarios."}
          </p>
        </>
      )}

      {request.status === "match_encontrado" && request.volunteer && (
        <>
          <p className="text-lg">¡Encontramos un match!</p>
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm text-left space-y-2">
            <p className="font-semibold">{request.volunteer.name}</p>
            <p className="text-sm text-neutral-400">{request.volunteer.profileSummary}</p>
            <p className="text-xs text-neutral-600 mt-2">
              Similaridad: {(request.matchScore! * 100).toFixed(0)}% — {request.matchReasoning}
            </p>
          </div>
          <button
            onClick={() => confirmMatch({ requestId: id as Id<"requests"> })}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
          >
            Confirmar y agendar videollamada
          </button>
        </>
      )}

      {request.status === "confirmado" && (
        <>
          <p className="text-lg">¡Match confirmado!</p>
          {request.roomUrl ? (
            <a
              href={request.roomUrl}
              target="_blank"
              className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
            >
              Entrar a la videollamada
            </a>
          ) : (
            <p className="text-sm text-neutral-500">Generando tu sala de videollamada...</p>
          )}
        </>
      )}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-50">
      {children}
    </main>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-amber-400 animate-spin" />
  );
}
