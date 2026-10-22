/// <reference types="vite/client" />
import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sumMoney } from "../lib/money";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const TODAY = "2026-10-20";

const eventArgs = {
  name: "Meera & Kabir's Engagement",
  type: "engagement" as const,
  date: "2027-01-10",
  city: "Jaipur",
  venue: "Heritage property",
  guestCount: 120,
  budget: 200_000,
  currency: "INR",
  styles: ["Traditional"],
  atmosphere: "Warm",
  foodPreferences: ["Vegetarian"],
  activities: ["Ring ceremony"],
  notes: "",
};

function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}

async function createUser(
  t: ReturnType<typeof setup>,
  fields: { isAnonymous?: boolean; email?: string } = {},
) {
  const userId = await t.run((ctx) => ctx.db.insert("users", fields));
  return { userId, as: t.withIdentity({ subject: `${userId}|session-${userId}` }) };
}

async function createEvent(user: Awaited<ReturnType<typeof createUser>>, t: ReturnType<typeof setup>) {
  const eventId = await user.as.mutation(api.events.create, { ...eventArgs, useAI: true, today: TODAY });
  // Run the scheduled blueprint generation (no GROQ_API_KEY → built-in planner).
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  return eventId;
}

beforeEach(() => {
  vi.useFakeTimers();
  delete process.env.GROQ_API_KEY;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("authentication", () => {
  it("rejects anonymous callers", async () => {
    const t = setup();
    await expect(t.query(api.events.list, {})).rejects.toThrow(/sign in/i);
    await expect(t.mutation(api.events.create, { ...eventArgs, useAI: false })).rejects.toThrow(/sign in/i);
  });
});

describe("event creation and the plan pipeline", () => {
  it("creates an event and falls back to the built-in planner without an AI key", async () => {
    const t = setup();
    const alice = await createUser(t);
    const eventId = await createEvent(alice, t);

    const data = await alice.as.query(api.events.get, { eventId });
    expect(data?.event.planStatus).toBe("ready");
    expect(data?.blueprint?.source).toBe("template");
    expect(data?.blueprint?.notice).toMatch(/built-in planner/);

    const items = await alice.as.query(api.budget.list, { eventId });
    expect(items.length).toBeGreaterThan(3);
    // Generated amounts always add up to the exact budget.
    expect(sumMoney(items.map((item) => item.estimated))).toBe(200_000);

    const tasks = await alice.as.query(api.tasks.list, { eventId });
    expect(tasks.length).toBeGreaterThan(5);
    expect(tasks.every((task) => task.dueMode === "relative")).toBe(true);
  });

  it("treats a double submission as one event", async () => {
    const t = setup();
    const alice = await createUser(t);
    const first = await alice.as.mutation(api.events.create, { ...eventArgs, useAI: false, today: TODAY });
    const second = await alice.as.mutation(api.events.create, { ...eventArgs, useAI: false, today: TODAY });
    expect(second).toBe(first);
  });

  it("validates input ranges", async () => {
    const t = setup();
    const alice = await createUser(t);
    await expect(
      alice.as.mutation(api.events.create, { ...eventArgs, budget: -1, useAI: false }),
    ).rejects.toThrow(/positive/);
    await expect(
      alice.as.mutation(api.events.create, { ...eventArgs, date: "2027-02-30", useAI: false }),
    ).rejects.toThrow(/valid date/);
    await expect(
      alice.as.mutation(api.events.create, { ...eventArgs, guestCount: 1.5, useAI: false }),
    ).rejects.toThrow(/whole number/);
    await expect(
      alice.as.mutation(api.events.create, { ...eventArgs, currency: "BTC", useAI: false }),
    ).rejects.toThrow(/currency/);
  });

  it("never replaces existing budget lines or tasks when regenerating", async () => {
    const t = setup();
    const alice = await createUser(t);
    const eventId = await createEvent(alice, t);
    const before = await alice.as.query(api.budget.list, { eventId });
    await alice.as.mutation(api.plans.regenerate, { eventId, useAI: false, today: TODAY });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const after = await alice.as.query(api.budget.list, { eventId });
    expect(after.map((item) => item._id)).toEqual(before.map((item) => item._id));
  });
});

describe("authorization boundaries", () => {
  it("keeps one user's celebration invisible and immutable to another", async () => {
    const t = setup();
    const alice = await createUser(t);
    const bob = await createUser(t);
    const eventId = await createEvent(alice, t);
    const [item] = await alice.as.query(api.budget.list, { eventId });
    const [task] = await alice.as.query(api.tasks.list, { eventId });

    expect(await bob.as.query(api.events.get, { eventId })).toBeNull();
    expect(await bob.as.query(api.events.list, {})).toEqual([]);
    await expect(bob.as.query(api.budget.list, { eventId })).rejects.toThrow(/could not be found/);
    await expect(bob.as.query(api.tasks.list, { eventId })).rejects.toThrow(/could not be found/);
    await expect(bob.as.mutation(api.events.update, { eventId, budget: 1 })).rejects.toThrow(
      /could not be found/,
    );
    await expect(bob.as.mutation(api.events.remove, { eventId })).rejects.toThrow(/could not be found/);
    await expect(bob.as.mutation(api.budget.update, { itemId: item._id, estimated: 0 })).rejects.toThrow(
      /could not be found/,
    );
    await expect(
      bob.as.mutation(api.tasks.setCompleted, { taskId: task._id, completed: true }),
    ).rejects.toThrow(/could not be found/);
    await expect(
      bob.as.mutation(api.concierge.send, { eventId, content: "Cut the budget to 1 lakh" }),
    ).rejects.toThrow(/could not be found/);

    // Alice's data is untouched.
    const data = await alice.as.query(api.events.get, { eventId });
    expect(data?.event.budget).toBe(200_000);
  });

  it("returns null for malformed IDs instead of throwing", async () => {
    const t = setup();
    const alice = await createUser(t);
    expect(await alice.as.query(api.events.get, { eventId: "not-an-id" })).toBeNull();
  });

  it("rejects reordering with tasks from another event", async () => {
    const t = setup();
    const alice = await createUser(t);
    const bob = await createUser(t);
    const aliceEvent = await createEvent(alice, t);
    const bobEvent = await createEvent(bob, t);
    const bobTasks = await bob.as.query(api.tasks.list, { eventId: bobEvent });
    await expect(
      alice.as.mutation(api.tasks.reorder, { eventId: aliceEvent, orderedIds: [bobTasks[0]._id] }),
    ).rejects.toThrow(/no longer exists/);
  });
});

describe("budget operations", () => {
  it("creates, updates, pays and deletes budget lines with validation", async () => {
    const t = setup();
    const alice = await createUser(t);
    const eventId = await createEvent(alice, t);

    const itemId = await alice.as.mutation(api.budget.create, {
      eventId,
      category: "decor",
      name: "Stage florals",
      estimated: 12_000,
      actual: null,
      paid: 0,
      notes: "",
    });
    await expect(
      alice.as.mutation(api.budget.create, {
        eventId,
        category: "decor",
        name: "Bad",
        estimated: Number.NaN,
        actual: null,
        paid: 0,
        notes: "",
      }),
    ).rejects.toThrow(/positive amount/);

    await alice.as.mutation(api.budget.update, { itemId, actual: 13_500 });
    await alice.as.mutation(api.budget.recordPayment, { itemId, mode: "full" });
    let item = (await alice.as.query(api.budget.list, { eventId })).find((i) => i._id === itemId);
    expect(item?.paid).toBe(13_500);

    await alice.as.mutation(api.budget.recordPayment, { itemId, mode: "clear" });
    item = (await alice.as.query(api.budget.list, { eventId })).find((i) => i._id === itemId);
    expect(item?.paid).toBe(0);

    await alice.as.mutation(api.budget.remove, { itemId });
    const items = await alice.as.query(api.budget.list, { eventId });
    expect(items.some((i) => i._id === itemId)).toBe(false);

    const activity = await alice.as.query(api.activity.recent, { eventId });
    expect(activity[0].message).toMatch(/Removed budget line/);
  });
});

describe("concierge", () => {
  it("proposes changes offline and applies only what the user approves", async () => {
    const t = setup();
    const alice = await createUser(t);
    const eventId = await createEvent(alice, t);

    await alice.as.mutation(api.concierge.send, {
      eventId,
      content: "My budget has dropped from ₹2,00,000 to ₹1,60,000. Help me adjust the plan.",
      today: TODAY,
    });
    // A second message while the first is pending is refused.
    await expect(alice.as.mutation(api.concierge.send, { eventId, content: "Hello?" })).rejects.toThrow(
      /still replying/,
    );
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const messages = await alice.as.query(api.concierge.list, { eventId });
    const reply = messages[messages.length - 1];
    expect(reply.role).toBe("assistant");
    expect(reply.engine).toBe("offline");
    expect(reply.proposal?.status).toBe("pending");

    // Nothing has changed before approval.
    expect((await alice.as.query(api.events.get, { eventId }))?.event.budget).toBe(200_000);

    const indexes = reply.proposal!.changes.map((_, index) => index);
    const result = await alice.as.mutation(api.concierge.applyProposal, {
      messageId: reply._id,
      changeIndexes: indexes,
      today: TODAY,
    });
    expect(result.applied).toBe(indexes.length);

    const event = (await alice.as.query(api.events.get, { eventId }))!.event;
    expect(event.budget).toBe(160_000);
    const items = await alice.as.query(api.budget.list, { eventId });
    expect(sumMoney(items.map((item) => item.actual ?? item.estimated))).toBeLessThanOrEqual(160_000);

    // The proposal records which changes were applied, so the card can show it later.
    const handled = (await alice.as.query(api.concierge.list, { eventId })).find((m) => m._id === reply._id);
    expect(handled?.proposal?.status).toBe("applied");
    expect(handled?.proposal?.appliedIndexes).toEqual(indexes);

    // A proposal can only be applied once.
    await expect(
      alice.as.mutation(api.concierge.applyProposal, { messageId: reply._id, changeIndexes: [0] }),
    ).rejects.toThrow(/already been handled/);
  });

  it("does not let another user apply or dismiss a proposal", async () => {
    const t = setup();
    const alice = await createUser(t);
    const bob = await createUser(t);
    const eventId = await createEvent(alice, t);
    await alice.as.mutation(api.concierge.send, { eventId, content: "Our budget is now ₹1,50,000" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const messages = await alice.as.query(api.concierge.list, { eventId });
    const reply = messages[messages.length - 1];

    await expect(
      bob.as.mutation(api.concierge.applyProposal, { messageId: reply._id, changeIndexes: [0] }),
    ).rejects.toThrow(/could not be found/);
    await expect(bob.as.mutation(api.concierge.dismissProposal, { messageId: reply._id })).rejects.toThrow(
      /could not be found/,
    );
  });
});

describe("moodboard", () => {
  it("only accepts https image links and valid colours", async () => {
    const t = setup();
    const alice = await createUser(t);
    const eventId = await createEvent(alice, t);
    const base = { eventId, title: "Look", category: "decor" as const, note: "" };
    await expect(
      alice.as.mutation(api.moodboard.addImage, { ...base, imageUrl: "javascript:alert(1)" }),
    ).rejects.toThrow(/https/);
    await expect(
      alice.as.mutation(api.moodboard.addImage, { ...base, imageUrl: "http://example.com/a.jpg" }),
    ).rejects.toThrow(/https/);
    await alice.as.mutation(api.moodboard.addImage, { ...base, imageUrl: "https://example.com/a.jpg" });
    await expect(
      alice.as.mutation(api.moodboard.addSwatch, { eventId, color: "red", title: "Red", note: "" }),
    ).rejects.toThrow(/#RRGGBB/);
    const items = await alice.as.query(api.moodboard.list, { eventId });
    expect(items).toHaveLength(1);
  });
});

describe("demo sessions", () => {
  it("seeds labelled sample data for anonymous users only, once", async () => {
    const t = setup();
    const guest = await createUser(t, { isAnonymous: true });
    const member = await createUser(t, { email: "host@example.com" });

    const eventId = await guest.as.mutation(api.demo.start, { today: TODAY });
    expect(await guest.as.mutation(api.demo.start, { today: TODAY })).toBe(eventId);

    const data = await guest.as.query(api.events.get, { eventId });
    expect(data?.event.isDemo).toBe(true);
    expect(data?.blueprint?.source).toBe("sample");
    const vendors = await guest.as.query(api.vendors.list, { eventId });
    expect(vendors.every((vendor) => vendor.isSample && /not a real business/.test(vendor.notes))).toBe(true);

    await expect(member.as.mutation(api.demo.start, { today: TODAY })).rejects.toThrow(/demo sessions/);
    expect(await member.as.query(api.events.get, { eventId })).toBeNull();
  });
});

describe("cascading delete", () => {
  it("removes every record that belongs to an event", async () => {
    const t = setup();
    const alice = await createUser(t);
    const eventId: Id<"events"> = await createEvent(alice, t);
    await alice.as.mutation(api.events.remove, { eventId });
    const leftovers = await t.run(async (ctx) => ({
      items: await ctx.db.query("budgetItems").collect(),
      tasks: await ctx.db.query("tasks").collect(),
      blueprints: await ctx.db.query("blueprints").collect(),
      activity: await ctx.db.query("activity").collect(),
    }));
    expect(leftovers).toEqual({ items: [], tasks: [], blueprints: [], activity: [] });
  });
});
