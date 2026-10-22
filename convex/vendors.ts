import { v } from "convex/values";
import { LIMITS } from "../lib/constants";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { logActivity, requireOwnedDoc, requireOwnedEvent, touchEvent } from "./lib/access";
import { limitWrites } from "./lib/rateLimits";
import { cleanLongText, cleanOptionalMoney, cleanText, invalid } from "./lib/input";
import { vCategory, vPaymentStatus, vVendorStatus } from "./lib/validators";
import schema from "./schema";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanContact(fields: { phone?: string; email?: string; website?: string }) {
  const out: { phone?: string; email?: string; website?: string } = {};
  if (fields.phone !== undefined) {
    const phone = cleanText(fields.phone, "Phone", 40);
    if (phone && !/^[+\d][\d\s().-]{5,}$/.test(phone)) throw invalid("Enter a valid phone number.");
    out.phone = phone;
  }
  if (fields.email !== undefined) {
    const email = cleanText(fields.email, "Email", 254).toLowerCase();
    if (email && !EMAIL.test(email)) throw invalid("Enter a valid email address.");
    out.email = email;
  }
  if (fields.website !== undefined) {
    let website = cleanText(fields.website, "Website", 300);
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if (website) {
      try {
        const url = new URL(website);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        throw invalid("Enter a valid website address.");
      }
    }
    out.website = website;
  }
  return out;
}

const vendorFields = {
  name: v.string(),
  category: vCategory,
  contactName: v.string(),
  phone: v.string(),
  email: v.string(),
  website: v.string(),
  quoteEstimated: v.union(v.number(), v.null()),
  quoteActual: v.union(v.number(), v.null()),
  status: vVendorStatus,
  paymentStatus: vPaymentStatus,
  notes: v.string(),
};

export const list = query({
  args: { eventId: v.id("events") },
  returns: v.array(schema.doc("vendors")),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    return await ctx.db
      .query("vendors")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(LIMITS.listMax);
  },
});

export const create = mutation({
  args: { eventId: v.id("events"), ...vendorFields },
  returns: v.id("vendors"),
  handler: async (ctx, args) => {
    const { userId, event } = await requireOwnedEvent(ctx, args.eventId);
    await limitWrites(ctx, userId);
    const name = cleanText(args.name, "Vendor name", LIMITS.nameMax, true);
    const id = await ctx.db.insert("vendors", {
      eventId: event._id,
      ownerId: event.ownerId,
      name,
      category: args.category,
      contactName: cleanText(args.contactName, "Contact name", LIMITS.nameMax),
      phone: "",
      email: "",
      website: "",
      ...cleanContact(args),
      quoteEstimated: cleanOptionalMoney(args.quoteEstimated, "Estimated quote"),
      quoteActual: cleanOptionalMoney(args.quoteActual, "Final quote"),
      status: args.status,
      paymentStatus: args.paymentStatus,
      notes: cleanLongText(args.notes, "Notes", 1000),
      isSample: false,
      updatedAt: Date.now(),
    });
    await logActivity(ctx, event, "vendor", `Added vendor “${name}”`);
    await touchEvent(ctx, event);
    return id;
  },
});

export const update = mutation({
  args: {
    vendorId: v.id("vendors"),
    name: v.optional(v.string()),
    category: v.optional(vCategory),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    quoteEstimated: v.optional(v.union(v.number(), v.null())),
    quoteActual: v.optional(v.union(v.number(), v.null())),
    status: v.optional(vVendorStatus),
    paymentStatus: v.optional(vPaymentStatus),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "vendors", args.vendorId);
    const patch: Partial<Doc<"vendors">> = { updatedAt: Date.now(), ...cleanContact(args) };
    if (args.name !== undefined) patch.name = cleanText(args.name, "Vendor name", LIMITS.nameMax, true);
    if (args.category !== undefined) patch.category = args.category;
    if (args.contactName !== undefined) {
      patch.contactName = cleanText(args.contactName, "Contact name", LIMITS.nameMax);
    }
    if (args.quoteEstimated !== undefined) {
      patch.quoteEstimated = cleanOptionalMoney(args.quoteEstimated, "Estimated quote");
    }
    if (args.quoteActual !== undefined)
      patch.quoteActual = cleanOptionalMoney(args.quoteActual, "Final quote");
    if (args.status !== undefined) patch.status = args.status;
    if (args.paymentStatus !== undefined) patch.paymentStatus = args.paymentStatus;
    if (args.notes !== undefined) patch.notes = cleanLongText(args.notes, "Notes", 1000);
    await ctx.db.patch("vendors", doc._id, patch);

    const name = patch.name ?? doc.name;
    const message =
      args.status && args.status !== doc.status
        ? args.status === "booked"
          ? `Booked “${name}”`
          : `Moved “${name}” to ${args.status}`
        : `Updated vendor “${name}”`;
    await logActivity(ctx, event, "vendor", message);
    await touchEvent(ctx, event);
    return null;
  },
});

export const remove = mutation({
  args: { vendorId: v.id("vendors") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "vendors", args.vendorId);
    await ctx.db.delete("vendors", doc._id);
    await logActivity(ctx, event, "vendor", `Removed vendor “${doc.name}”`);
    await touchEvent(ctx, event);
    return null;
  },
});
