import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  date,
  time,
  boolean,
  jsonb,
  pgEnum,
  unique,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const venueTypeEnum = pgEnum("venue_type", [
  "comedy_club",
  "theatre",
  "arena",
  "arts_centre",
  "pub",
  "other",
]);

export const tourStatusEnum = pgEnum("tour_status", [
  "planning",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const showStatusEnum = pgEnum("show_status", [
  "planned",
  "contacted",
  "booked",
  "rider_sent",
  "confirmed",
  "completed",
  "unavailable",
  "cancelled",
]);

export const settlementTypeEnum = pgEnum("settlement_type", [
  "guarantee",
  "flat_fee",
  "split",
  "guarantee_vs_split",
]);

export const travelTypeEnum = pgEnum("travel_type", [
  "train",
  "car",
  "flight",
  "tour_bus",
  "other",
]);

export const reminderTypeEnum = pgEnum("reminder_type", [
  "venue_followup",
  "rider_due",
  "marketing_deadline",
  "settlement_due",
  "tech_rider_confirm",
  "accommodation_booking",
  "travel_booking",
  "ticket_on_sale",
  "custom",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "viewer",
  "editor",
  "admin",
  "owner",
]);

export const lockResourceTypeEnum = pgEnum("lock_resource_type", [
  "tour",
  "show",
  "comedian",
  "venue",
  "show_tickets",
  "show_accommodation",
  "show_travel",
  "settings_team",
]);

export const activityActionEnum = pgEnum("activity_action", [
  "create",
  "update",
  "delete",
  "restore",
  "invite",
  "force_unlock",
  "role_change",
]);

/* -------------------------------------------------------------------------- */
/*                              Multi-tenancy root                            */
/* -------------------------------------------------------------------------- */

/**
 * Organisations exist from day one to support future SaaS multi-tenancy.
 * In V1, each user has exactly one org created on signup.
 */
export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Maps Supabase auth.users -> organisations. A user may belong to one org
 * in V1; the table shape allows expanding to many in future without migration
 * to a new model.
 */
export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    // References auth.users(id) in Supabase. Not a FK because that schema is
    // managed by Supabase Auth.
    userId: uuid("user_id").notNull(),
    role: memberRoleEnum("role").notNull().default("editor"),
    canViewFinancials: boolean("can_view_financials").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("org_members_org_user_unique").on(t.orgId, t.userId),
    index("org_members_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                   Venues                                   */
/* -------------------------------------------------------------------------- */

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    venueType: venueTypeEnum("venue_type").notNull().default("comedy_club"),

    // Address
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    postcode: text("postcode"),
    country: text("country").default("United Kingdom"),

    // Capacity
    capacity: integer("capacity"),
    capacityNotes: text("capacity_notes"),

    // Primary contact
    primaryContactName: text("primary_contact_name"),
    primaryContactRole: text("primary_contact_role"),
    primaryContactPhone: text("primary_contact_phone"),
    primaryContactEmail: text("primary_contact_email"),

    // Secondary contact
    secondaryContactName: text("secondary_contact_name"),
    secondaryContactRole: text("secondary_contact_role"),
    secondaryContactPhone: text("secondary_contact_phone"),
    secondaryContactEmail: text("secondary_contact_email"),

    // Technical contact
    technicalContactName: text("technical_contact_name"),
    technicalContactPhone: text("technical_contact_phone"),
    technicalContactEmail: text("technical_contact_email"),

    stageDimensions: text("stage_dimensions"),
    loadInDetails: text("load_in_details"),
    parkingInfo: text("parking_info"),
    notes: text("notes"),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("venues_org_idx").on(t.orgId),
    index("venues_city_idx").on(t.city),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                 Comedians                                  */
/* -------------------------------------------------------------------------- */

export const comedians = pgTable(
  "comedians",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),

    stageName: text("stage_name").notNull(),
    legalName: text("legal_name"),

    phone: text("phone"),
    email: text("email"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    postcode: text("postcode"),
    country: text("country"),

    // Agent
    agentName: text("agent_name"),
    agentCompany: text("agent_company"),
    agentPhone: text("agent_phone"),
    agentEmail: text("agent_email"),

    // Manager
    managerName: text("manager_name"),
    managerCompany: text("manager_company"),
    managerPhone: text("manager_phone"),
    managerEmail: text("manager_email"),

    hospitalityRider: text("hospitality_rider"),
    technicalRider: text("technical_rider"),
    dressingRoomRequirements: text("dressing_room_requirements"),
    accessibilityRequirements: text("accessibility_requirements"),

    socialInstagram: text("social_instagram"),
    socialTwitter: text("social_twitter"),
    socialTikTok: text("social_tiktok"),
    socialOther: text("social_other"),

    // Optional link to a real user account (when the comedian themselves logs
    // in). References auth.users(id) — not a hard FK.
    userId: uuid("user_id"),

    notes: text("notes"),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("comedians_org_idx").on(t.orgId),
    index("comedians_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                   Tours                                    */
/* -------------------------------------------------------------------------- */

export const tours = pgTable(
  "tours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    comedianId: uuid("comedian_id")
      .notNull()
      .references(() => comedians.id, { onDelete: "restrict" }),

    name: text("name").notNull(),
    status: tourStatusEnum("status").notNull().default("planning"),

    startDate: date("start_date"),
    endDate: date("end_date"),

    description: text("description"),

    // Marketing (tour-wide)
    marketingCopy: text("marketing_copy"),
    pressRelease: text("press_release"),
    photoAssetsNotes: text("photo_assets_notes"),
    socialCopyTemplate: text("social_copy_template"),

    // Budget (in pence, GBP). Use integers to avoid float drift.
    budgetPence: integer("budget_pence"),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("tours_org_idx").on(t.orgId),
    index("tours_comedian_idx").on(t.comedianId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                   Shows                                    */
/* -------------------------------------------------------------------------- */

export const shows = pgTable(
  "shows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    tourId: uuid("tour_id")
      .notNull()
      .references(() => tours.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),

    showDate: date("show_date").notNull(),
    city: text("city"),
    showTime: time("show_time"),
    doorsTime: time("doors_time"),
    supportAct: text("support_act"),
    contractUrl: text("contract_url"),
    notes: text("notes"),

    // Booking workflow
    status: showStatusEnum("status").notNull().default("planned"),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

    // Venue financial terms (all monetary fields in pence)
    venueHireFeePence: integer("venue_hire_fee_pence"),
    venueDepositPence: integer("venue_deposit_pence"),
    venueDepositPaid: boolean("venue_deposit_paid").notNull().default(false),
    settlementType: settlementTypeEnum("settlement_type"),
    settlementSplitPercent: numeric("settlement_split_percent", {
      precision: 5,
      scale: 2,
    }),
    settlementGuaranteePence: integer("settlement_guarantee_pence"),

    // Local marketing
    marketingBudgetPence: integer("marketing_budget_pence"),
    marketingCopy: text("marketing_copy"),
    marketingNotes: text("marketing_notes"),

    // Ticketing (V1: single price + capacity per show)
    ticketPricePence: integer("ticket_price_pence"),
    ticketCapacity: integer("ticket_capacity"),
    // Estimated (pre-show)
    estTicketsSold: integer("est_tickets_sold"),
    estTicketsSoldPct: numeric("est_tickets_sold_pct", { precision: 5, scale: 2 }),
    // Actual (post-show — revenue is manually entered, not calculated)
    ticketsSold: integer("tickets_sold").notNull().default(0),
    ticketsComped: integer("tickets_comped").notNull().default(0),
    actualRevenuePence: integer("actual_revenue_pence"),
    actualTicketPricePence: integer("actual_ticket_price_pence"),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("shows_org_idx").on(t.orgId),
    index("shows_tour_idx").on(t.tourId),
    index("shows_date_idx").on(t.showDate),
    // Per-tour uniqueness of (date, venue) is too strict; we instead enforce
    // no double-booking of the same comedian on the same date via a partial
    // unique index added in a migration (see post-generate notes in README).
  ],
);

/* -------------------------------------------------------------------------- */
/*                          Show costs (accommodation, travel)                */
/* -------------------------------------------------------------------------- */

export const accommodations = pgTable(
  "accommodations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    showId: uuid("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),

    hotelName: text("hotel_name"),
    address: text("address"),
    checkIn: date("check_in"),
    checkInTime: time("check_in_time"),
    checkOut: date("check_out"),
    checkOutTime: time("check_out_time"),
    bookingReference: text("booking_reference"),
    contactPhone: text("contact_phone"),
    costPence: integer("cost_pence"),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("accommodations_show_idx").on(t.showId)],
);

export const travel = pgTable(
  "travel",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    showId: uuid("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),

    travelType: travelTypeEnum("travel_type").notNull().default("train"),
    departureLocation: text("departure_location"),
    departureAt: timestamp("departure_at", { withTimezone: true }),
    arrivalLocation: text("arrival_location"),
    arrivalAt: timestamp("arrival_at", { withTimezone: true }),
    bookingReference: text("booking_reference"),
    costPence: integer("cost_pence"),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("travel_show_idx").on(t.showId)],
);

/* -------------------------------------------------------------------------- */
/*                                  Reminders                                 */
/* -------------------------------------------------------------------------- */

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    // Reminders may be attached to a show, tour, or stand alone.
    showId: uuid("show_id").references(() => shows.id, { onDelete: "cascade" }),
    tourId: uuid("tour_id").references(() => tours.id, { onDelete: "cascade" }),

    type: reminderTypeEnum("type").notNull().default("custom"),
    title: text("title").notNull(),
    notes: text("notes"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("reminders_org_idx").on(t.orgId),
    index("reminders_due_idx").on(t.dueAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*                              Sharing & invites                             */
/* -------------------------------------------------------------------------- */

/** Per-tour collaborator with optional role override. */
export const tourCollaborators = pgTable(
  "tour_collaborators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    tourId: uuid("tour_id")
      .notNull()
      .references(() => tours.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: memberRoleEnum("role").notNull().default("editor"),
    canViewFinancials: boolean("can_view_financials").notNull().default(false),
    invitedBy: uuid("invited_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("tour_collaborators_tour_user_unique").on(t.tourId, t.userId),
    index("tour_collaborators_user_idx").on(t.userId),
    index("tour_collaborators_org_idx").on(t.orgId),
  ],
);

/**
 * Invitation links. `tour_id` null = org-wide invite. Tokens are
 * cryptographically random and single-use within the expiry window.
 */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    tourId: uuid("tour_id").references(() => tours.id, { onDelete: "cascade" }),
    email: text("email"),
    role: memberRoleEnum("role").notNull().default("editor"),
    canViewFinancials: boolean("can_view_financials").notNull().default(true),
    token: text("token").notNull().unique(),
    invitedBy: uuid("invited_by").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: uuid("accepted_by"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("invitations_org_idx").on(t.orgId),
    index("invitations_email_idx").on(t.email),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                 Edit locks                                 */
/* -------------------------------------------------------------------------- */

/**
 * Pessimistic per-resource edit lock. PK is composite (resource_type, resource_id).
 * Lazy expiry: a lock is "free" if `expires_at < now()`.
 */
export const editLocks = pgTable(
  "edit_locks",
  {
    resourceType: lockResourceTypeEnum("resource_type").notNull(),
    resourceId: uuid("resource_id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.resourceType, t.resourceId] }),
    index("edit_locks_org_idx").on(t.orgId),
    index("edit_locks_user_idx").on(t.userId),
    index("edit_locks_expires_idx").on(t.expiresAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                Activity log                                */
/* -------------------------------------------------------------------------- */

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id"),
    action: activityActionEnum("action").notNull(),
    summary: text("summary").notNull(),
    // Free-form structured payload — typically { field: { from, to } } diffs.
    changes: jsonb("changes").$type<Record<string, { from: unknown; to: unknown }> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("activity_log_org_created_idx").on(t.orgId, t.createdAt),
    index("activity_log_resource_idx").on(t.resourceType, t.resourceId),
    index("activity_log_user_idx").on(t.userId),
  ],
);

export const notificationTypeEnum = pgEnum("notification_type", [
  "invite_received",
  "tour_shared",
  "role_changed",
  "force_unlocked",
  "reminder_due",
]);

export const calendarScopeEnum = pgEnum("calendar_scope", [
  "org",
  "tour",
  "comedian",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    orgId: uuid("org_id").references(() => organisations.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const showTasks = pgTable(
  "show_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    showId: uuid("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    done: boolean("done").notNull().default(false),
    doneAt: timestamp("done_at", { withTimezone: true }),
    doneByUserId: uuid("done_by_user_id"),
    dueAt: date("due_at"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("show_tasks_show_idx").on(t.showId, t.sortOrder),
  ],
);

export const calendarTokens = pgTable(
  "calendar_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    scope: calendarScopeEnum("scope").notNull(),
    scopeId: uuid("scope_id"),
    token: text("token").notNull().unique(),
    label: text("label"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("calendar_tokens_user_idx").on(t.userId),
    index("calendar_tokens_token_idx").on(t.token),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                  Relations                                 */
/* -------------------------------------------------------------------------- */

export const organisationsRelations = relations(organisations, ({ many }) => ({
  members: many(orgMembers),
  venues: many(venues),
  comedians: many(comedians),
  tours: many(tours),
}));

export const toursRelations = relations(tours, ({ one, many }) => ({
  comedian: one(comedians, {
    fields: [tours.comedianId],
    references: [comedians.id],
  }),
  shows: many(shows),
}));

export const showsRelations = relations(shows, ({ one, many }) => ({
  tour: one(tours, { fields: [shows.tourId], references: [tours.id] }),
  venue: one(venues, { fields: [shows.venueId], references: [venues.id] }),
  accommodations: many(accommodations),
  travel: many(travel),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  shows: many(shows),
}));

export const comediansRelations = relations(comedians, ({ many }) => ({
  tours: many(tours),
}));

/* -------------------------------------------------------------------------- */
/*                              Inferred TS types                             */
/* -------------------------------------------------------------------------- */

export type Organisation = typeof organisations.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;
export type Comedian = typeof comedians.$inferSelect;
export type NewComedian = typeof comedians.$inferInsert;
export type Tour = typeof tours.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type Accommodation = typeof accommodations.$inferSelect;
export type Travel = typeof travel.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type OrgMember = typeof orgMembers.$inferSelect;
export type TourCollaborator = typeof tourCollaborators.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];
export type EditLock = typeof editLocks.$inferSelect;
export type LockResourceType = (typeof lockResourceTypeEnum.enumValues)[number];
export type ActivityLog = typeof activityLog.$inferSelect;
export type ActivityAction = (typeof activityActionEnum.enumValues)[number];
export type Notification = typeof notifications.$inferSelect;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type ShowTask = typeof showTasks.$inferSelect;
export type NewShowTask = typeof showTasks.$inferInsert;
export type CalendarToken = typeof calendarTokens.$inferSelect;
export type CalendarScope = (typeof calendarScopeEnum.enumValues)[number];

// Re-exported for migration files that need raw SQL helpers.
export { sql };
