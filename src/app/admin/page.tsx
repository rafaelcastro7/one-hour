"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function AdminPage() {
  const pending = useQuery(api.volunteers.pendingApproval);
  const approve = useMutation(api.volunteers.approve);
  const verifyResource = useAction(api.linkup.verifyResource);
  const searchRegistry = useAction(api.linkup.searchRegistry);
  const [error, setError] = useState<string | null>(null);

  const [resourceUrl, setResourceUrl] = useState("https://findahelpline.com");
  const [resourceResult, setResourceResult] = useState<string | null>(null);
  const [registryQuery, setRegistryQuery] = useState("");
  const [registryResult, setRegistryResult] = useState<{
    answer: string;
    sources: Array<{ url: string | null; name: string | null }>;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleCheckResource() {
    if (!resourceUrl.trim() || checking) return;
    setChecking(true);
    setResourceResult(null);
    try {
      const r = await verifyResource({ url: resourceUrl.trim() });
      setResourceResult(
        r.alive ? `Alive — ${r.snippet.slice(0, 160)}…` : "No readable content — link may be dead."
      );
    } catch {
      setResourceResult("Check failed — is LINKUP_API_KEY set on this deployment?");
    } finally {
      setChecking(false);
    }
  }

  async function handleSearchRegistry() {
    if (!registryQuery.trim() || checking) return;
    setChecking(true);
    setRegistryResult(null);
    try {
      const r = await searchRegistry({ query: registryQuery.trim() });
      setRegistryResult(r);
    } catch {
      setRegistryResult({ answer: "Search failed — is LINKUP_API_KEY set on this deployment?", sources: [] });
    } finally {
      setChecking(false);
    }
  }

  async function handleApprove(id: Id<"volunteers">) {
    setError(null);
    try {
      await approve({ volunteerId: id });
    } catch (e) {
      // Approving a volunteer whose intake failed is rejected server-side;
      // surface that instead of letting the click appear to do nothing.
      setError(e instanceof Error ? e.message : "Could not approve this volunteer.");
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-6 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">Volunteer approval</h1>
      <p className="text-sm text-neutral-400 max-w-md text-center">
        Manual human gate: verify each person is who they say they are before
        activating them, especially in sensitive categories.
      </p>

      {error && (
        <p className="max-w-2xl text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="w-full max-w-2xl flex flex-col gap-4">
        {pending === undefined && <p className="text-neutral-500">Loading...</p>}
        {pending?.length === 0 && (
          <p className="text-neutral-500">No volunteers pending approval.</p>
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
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {v.linkedinUrl ? (
                  <a
                    href={v.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline"
                  >
                    LinkedIn profile
                  </a>
                ) : (
                  <span className="text-red-300">No LinkedIn — cannot approve</span>
                )}
                <span className="text-neutral-500">
                  Quiz: {v.quizScore ?? 0}/3{v.skillLevel ? ` (${v.skillLevel})` : ""}
                </span>
                {v.slots && v.slots.length > 0 && (
                  <span className="text-neutral-500">
                    Free: {v.slots.slice(0, 4).join(", ")}{v.slots.length > 4 ? ` +${v.slots.length - 4}` : ""}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleApprove(v._id as Id<"volunteers">)}
              className="shrink-0 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
