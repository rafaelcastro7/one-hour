"use client";

import { useMutation, useQuery } from "convex/react";
import { use } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const request = useQuery(api.requests.get, { requestId: id as Id<"requests"> });
  const confirmMatch = useMutation(api.requests.confirmMatch);

  if (request === undefined) {
    return <Centered>Loading...</Centered>;
  }

  if (request === null) {
    return <Centered>We couldn&apos;t find that request.</Centered>;
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-6 bg-neutral-950 text-neutral-50 text-center">
      {request.status === "searching" && (
        <>
          <Spinner />
          <p className="text-lg">Finding the right person for you...</p>
          {/* The pipeline takes ~35s across two LLM calls, so show which
              stage we're actually in rather than one opaque spinner.
              needSummary lands the moment the first call returns, which is
              what lets us tell the two apart without extra backend state. */}
          {request.needSummary ? (
            <div className="max-w-sm space-y-3">
              <Stage done label="Understood what you need" />
              <p className="text-sm text-neutral-400 italic">
                &ldquo;{request.needSummary}&rdquo;
              </p>
              <Stage label="Comparing against available volunteers" />
            </div>
          ) : (
            <div className="max-w-sm space-y-3">
              <Stage label="Reading your conversation" />
            </div>
          )}
        </>
      )}

      {request.status === "failed" && (
        <>
          <p className="text-lg">Something went wrong on our side.</p>
          <p className="text-sm text-neutral-500 max-w-sm">
            {request.matchReasoning ??
              "The matching service didn't respond in time. Your request is saved — please try again."}
          </p>
        </>
      )}

      {request.status === "no_match" && (
        <>
          <p className="text-lg">We couldn&apos;t find anyone available right now.</p>
          <p className="text-sm text-neutral-500 max-w-sm">
            {request.matchReasoning ?? "Try again later, we keep adding volunteers."}
          </p>
        </>
      )}

      {request.status === "match_found" && request.volunteer && (
        <>
          <p className="text-lg">We found a match!</p>
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm text-left space-y-2">
            <p className="font-semibold">{request.volunteer.name}</p>
            <p className="text-sm text-neutral-400">{request.volunteer.profileSummary}</p>
            <p className="text-xs text-neutral-600 mt-2">
              Similarity: {(request.matchScore! * 100).toFixed(0)}% — {request.matchReasoning}
            </p>
          </div>
          <button
            onClick={() => confirmMatch({ requestId: id as Id<"requests"> })}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
          >
            Confirm and schedule the call
          </button>
        </>
      )}

      {request.status === "confirmed" && (
        <>
          <p className="text-lg">Match confirmed!</p>
          {request.roomUrl ? (
            <a
              href={request.roomUrl}
              target="_blank"
              className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
            >
              Join the video call
            </a>
          ) : (
            <p className="text-sm text-neutral-500">Generating your video call room...</p>
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

function Stage({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={done ? "text-emerald-400" : "text-neutral-600"}>
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-neutral-300" : "text-neutral-500"}>{label}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-amber-400 animate-spin" />
  );
}
