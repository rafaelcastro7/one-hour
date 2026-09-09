import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Group sessions (ADPList-style templates, 1 room, N members). The host is
// always a verified human volunteer; members join by email (no auth) and the
// Daily.co room generates once the group is full or the host confirms it.

export const createGroup = mutation({
  args: {
    volunteerEmail: v.string(),
    title: v.string(),
    category: v.union(v.literal("tech"), v.literal("languages")),
    template: v.string(),
    slots: v.array(v.string()),
    capacity: v.number(),
    hostCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireHostCode(args.hostCode);
    if (!args.title.trim()) throw new Error("Give your group a title.");
    if (!Number.isInteger(args.capacity) || args.capacity < 2 || args.capacity > 12) {
      throw new Error("Capacity must be between 2 and 12.");
    }
    if (args.slots.length === 0) throw new Error("Pick at least one time slot.");
    const vol = await ctx.db
      .query("volunteers")
      .withIndex("by_email", (q) => q.eq("email", args.volunteerEmail.toLowerCase().trim()))
      .unique();
    if (!vol || !vol.active || !vol.verified || vol.isVirtual) {
      throw new Error("Only active, verified human volunteers can host groups.");
    }
    return await ctx.db.insert("groups", {
      volunteerId: vol._id,
      title: args.title.trim().slice(0, 80),
      category: args.category,
      template: args.template.slice(0, 40),
      slots: args.slots,
      capacity: args.capacity,
      members: [],
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const g = await ctx.db.get(groupId);
    if (!g) return null;
    const vol = await ctx.db.get(g.volunteerId);
    return {
      ...g,
      hostName: vol?.name ?? "Unknown host",
      spotsLeft: Math.max(0, g.capacity - g.members.length),
    };
  },
});

export const listOpen = query({
  args: { category: v.optional(v.union(v.literal("tech"), v.literal("languages"))) },
  handler: async (ctx, { category }) => {
    const rows = await ctx.db
      .query("groups")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const filtered = category ? rows.filter((g) => g.category === category) : rows;
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const g of filtered) {
      const vol = await ctx.db.get(g.volunteerId);
      out.push({
        ...g,
        hostName: vol?.name ?? "Unknown host",
        spotsLeft: Math.max(0, g.capacity - g.members.length),
      });
    }
    return out;
  },
});

export const joinGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { groupId, name, email }) => {
    if (!name.trim() || name.trim().length > 80) throw new Error("Tell us your name (1–80 characters) so the host knows who is coming.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("That email doesn't look valid.");
    }
    const g = await ctx.db.get(groupId);
    if (!g) throw new Error("Group not found.");
    if (g.status !== "open") throw new Error("This group is no longer open.");
    const lower = email.toLowerCase().trim();
    if (g.members.some((m) => m.email === lower)) throw new Error("You're already in this group.");
    if (g.members.length >= g.capacity) throw new Error("This group just filled up.");
    const members = [...g.members, { name: name.trim(), email: lower }];
    const full = members.length >= g.capacity;
    await ctx.db.patch(groupId, {
      members,
      ...(full ? { status: "ready" as const } : {}),
    });
    if (full && !g.roomUrl) {
      await ctx.scheduler.runAfter(0, internal.groups.createGroupRoom, { groupId });
    }
    return { spotsLeft: Math.max(0, g.capacity - members.length), ready: full };
  },
});

// Host confirms early (before full): room generates now, group closes to
// new members. Members get the same link from the group card.
export const confirmGroup = mutation({
  args: { groupId: v.id("groups"), volunteerEmail: v.string(), hostCode: v.optional(v.string()) },
  handler: async (ctx, { groupId, volunteerEmail, hostCode }) => {
    requireHostCode(hostCode);
    const g = await ctx.db.get(groupId);
    if (!g) throw new Error("Group not found.");
    const vol = await ctx.db.get(g.volunteerId);
    if (!vol || vol.email !== volunteerEmail.toLowerCase().trim()) {
      throw new Error("Only the host can confirm this group.");
    }
    if (g.status !== "open") throw new Error("This group is already confirmed or closed.");
    if (g.members.length === 0) throw new Error("Wait for at least one member before confirming.");
    await ctx.db.patch(groupId, { status: "ready" });
    if (!g.roomUrl) {
      await ctx.scheduler.runAfter(0, internal.groups.createGroupRoom, { groupId });
    }
  },
});

// Undo a join while the group is still open. Once ready (room generated),
// leaving is blocked: the room counts on its members.
export const leaveGroup = mutation({
  args: { groupId: v.id("groups"), email: v.string() },
  handler: async (ctx, { groupId, email }) => {
    const g = await ctx.db.get(groupId);
    if (!g) throw new Error("Group not found.");
    if (g.status !== "open") throw new Error("This group already has its room — leaving is closed.");
    const lower = email.toLowerCase().trim();
    if (!g.members.some((m) => m.email === lower)) throw new Error("You're not in this group.");
    await ctx.db.patch(groupId, { members: g.members.filter((m) => m.email !== lower) });
  },
});

export const closeGroup = mutation({
  args: { groupId: v.id("groups"), volunteerEmail: v.string(), hostCode: v.optional(v.string()) },
  handler: async (ctx, { groupId, volunteerEmail, hostCode }) => {
    requireHostCode(hostCode);
    const g = await ctx.db.get(groupId);
    if (!g) throw new Error("Group not found.");
    const vol = await ctx.db.get(g.volunteerId);
    if (!vol || vol.email !== volunteerEmail.toLowerCase().trim()) {
      throw new Error("Only the host can close this group.");
    }
    await ctx.db.patch(groupId, { status: "closed" });
  },
});

function requireHostCode(hostCode: string | undefined) {
  const expected = process.env.GROUP_HOST_CODE;
  if (!expected) {
    throw new Error("Group hosting is not configured.");
  }
  if (!hostCode || hostCode !== expected) {
    throw new Error("Verified host code is required.");
  }
}

export const setGroupRoomUrl = internalMutation({
  args: { groupId: v.id("groups"), roomUrl: v.string() },
  handler: async (ctx, { groupId, roomUrl }) => {
    await ctx.db.patch(groupId, { roomUrl });
  },
});

// Daily.co room for a ready group. Same retry-and-say-so pattern as the
// 1:1 rooms: a silent failure would strand every member on a dead card.
export const createGroupRoom = internalAction({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const roomName = `one-hour-group-${String(groupId).slice(0, 8)}-${Date.now()}`;
    try {
      const res = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            exp: Math.round(Date.now() / 1000) + 60 * 60 * 3,
            enable_chat: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(`Daily.co failed (${res.status})`);
      await ctx.runMutation(internal.groups.setGroupRoomUrl, { groupId, roomUrl: data.url });
    } catch (err) {
      console.error("createGroupRoom failed", err);
    }
  },
});
