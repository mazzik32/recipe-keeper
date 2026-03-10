# Admin Analytics Dashboard Spec

## 1. Goal

Build a read-only admin analytics portal for `admin.recipekeeper.org` with the existing Recipe Keeper design language. The portal should give a balanced overview of monetization, user/account state, and operational activity.

This admin portal is focused on consumable scan-credit packs, not recurring subscriptions.

## 2. Confirmed Product Decisions

- Ignore Stripe in the dashboard scope
- Admin portal is read-only in v1
- Include both KPI cards/tables and charts in v1
- No per-user drill-down pages in v1
- Protect the admin portal with Cloudflare Access only
- Place the spec at `docs/admin-analytics-dashboard-spec.md`

## 3. Current-State Findings

### 3.1 Monetization flows already present

The codebase currently supports:
- Apple iOS in-app purchase verification via `/api/iap/verify`
- Google Play in-app purchase verification via `/api/iap/verify`
- Paddle web checkout and fulfillment via `/api/paddle/checkout` and `/api/paddle/webhook`

Stripe code still exists, but it should be excluded from this dashboard.

### 3.2 Existing persisted data that can help

- `profiles`
  - includes `credits`
- `recipes`
  - includes `created_at`
- `webhook_events`
  - stores provider + event id for idempotency
- anonymous session creation flow exists

### 3.3 Core gap

The current system fulfills credits, but it does not maintain a clean analytics ledger for:
- purchased credits by channel and pack
- consumed credits over time
- anonymous vs registered snapshots at event time
- scan/analyze event tracking
- conversion funnel tracking

Because of this, a trustworthy dashboard needs an analytics foundation first.

## 4. Recommendation

Use **Analytics foundation first**.

That means:
1. add analytics/event tables and credit ledger tables
2. instrument the important flows
3. then build the admin UI on top of reliable aggregated data

This is the safest way to avoid misleading dashboard numbers.

## 5. Dashboard Objectives

The admin portal should answer these questions quickly:

### 5.1 Users
- How many total users do we have?
- How many are anonymous vs registered?
- How many new users arrived in a selected time range?
- Are anonymous users converting into registered users?

### 5.2 Monetization
- How many scan-credit packs were sold?
- Which channel is driving purchases: iOS, Android, or Paddle web?
- Which pack sizes sell best?
- How many credits were purchased vs consumed?
- What is the current outstanding credit balance across users?

### 5.3 Operations / product activity
- How many recipes were created?
- How many recipes were scanned / analyzed?
- How does activity trend over hour, day, week, month, and year?
- Are there spikes or drop-offs in ingestion or purchase behavior?

## 6. Time Analysis Requirements

The dashboard must support analysis by:
- hour
- day
- week
- month
- year

This applies to charts and, where useful, KPI comparison views.

## 7. Proposed Information Architecture

Full v1 page set:

1. **Overview**
2. **Revenue & Credits**
3. **Users**
4. **Recipes & Scans**
5. **Operations**

## 8. V1 Page Definitions

### 8.1 Overview

Purpose: fast executive snapshot.

Content:
- KPI cards
  - total users
  - anonymous users
  - registered users
  - new users in range
  - total recipes
  - recipes scanned/analyzed in range
  - credits purchased in range
  - credits consumed in range
  - outstanding credits balance
- trend charts
  - users over time
  - recipe/scanning activity over time
  - credits purchased vs consumed over time
- compact breakdown cards
  - purchases by channel
  - pack mix
  - anonymous vs registered share

### 8.2 Revenue & Credits

Purpose: monetization and credit system visibility.

Content:
- chart: purchased credits over time
- chart: consumed credits over time
- chart: purchases by channel over time
- chart: purchases by pack size over time
- KPI cards
  - total purchased credits
  - total consumed credits
  - total outstanding credits
  - total transactions
- tables
  - recent purchases
  - top pack sizes
  - top purchase channels

Notes:
- Because Stripe is excluded, only show iOS, Android, and Paddle web.
- If price data is incomplete historically, define revenue as a clearly labeled proxy until exact historical amount reconstruction is confirmed.

### 8.3 Users

Purpose: user population and funnel visibility.

Content:
- KPI cards
  - total users
  - anonymous users
  - registered users
  - new anonymous users in range
  - new registered users in range
- chart: user growth over time
- chart: anonymous vs registered split over time
- funnel module
  - anonymous session created
  - registered account created
  - first recipe created
  - first purchase completed
- table
  - newest users summary
  - highest remaining credits users

### 8.4 Recipes & Scans

Purpose: understand ingestion and usage behavior.

Content:
- KPI cards
  - recipes created in range
  - scan attempts in range
  - scan completions in range
  - scan-to-save ratio
- chart: recipes created over time
- chart: scan started vs scan completed over time
- chart: scan activity by channel/platform if available
- tables
  - recent scan events
  - recent recipe creations

### 8.5 Operations

Purpose: support health and reconciliation.

Content:
- webhook processing summary
- duplicate webhook counts
- failed fulfillment / failed analytics write counts if tracked
- recent webhook or purchase processing events
- data freshness indicators

This page is intentionally read-only and operational, not an intervention console.

## 9. Filters and Controls

Global filters:
- date range
- granularity: hour/day/week/month/year
- channel: all / iOS / Android / Paddle web
- user type: all / anonymous / registered
- pack size: all / 20 / 50 / 200 / 400

The active filter state should be URL-driven using search params.

## 10. Design / UI Direction

The admin portal should reuse the existing Recipe Keeper visual language:
- warm neutral background
- peach accent colors
- rounded cards
- soft borders
- same typography rhythm as the customer dashboard
- same spacing system

Suggested admin UI structure:
- left sidebar navigation on desktop
- top filter/action bar
- stacked KPI cards
- chart cards with consistent heights
- responsive tables below charts

The admin portal should feel like part of the same product family, but more data-dense.

## 11. Recommended Data Foundation

### 11.1 `credit_transactions`

Create an append-only credit ledger.

Suggested fields:
- `id`
- `user_id`
- `direction` (`grant`, `consume`, `adjustment`)
- `amount`
- `source` (`signup_bonus`, `iap_ios`, `iap_android`, `paddle`, `scan_consume`, `admin_adjustment`)
- `source_reference`
- `pack_code`
- `user_type_snapshot` (`anonymous`, `registered`)
- `metadata` jsonb
- `created_at`

Purpose:
- source of truth for credits purchased/consumed
- channel and pack breakdowns
- balance reconciliation support

### 11.2 `analytics_events`

Create an append-only event analytics table.

Suggested fields:
- `id`
- `event_name`
- `user_id` nullable
- `user_type_snapshot`
- `channel`
- `recipe_id` nullable
- `metadata` jsonb
- `occurred_at`
- `created_at`

Suggested event names:
- `anonymous_session_created`
- `user_registered`
- `recipe_scan_started`
- `recipe_scan_completed`
- `recipe_created`
- `purchase_completed`

Purpose:
- funnel analysis
- operational activity charts
- product behavior reporting

### 11.3 Aggregation layer

Add SQL views or materialized views for fast reads, for example:
- `admin_kpi_rollups`
- `admin_credit_sales_rollups`
- `admin_usage_rollups`
- `admin_funnel_rollups`

These should group data at the supported time granularities or at least support efficient aggregation.

## 12. Instrumentation Requirements

Instrument these flows to populate the new analytics foundation:

### 12.1 Account flows
- anonymous session creation
- registration / account upgrade from anonymous to registered if detectable

### 12.2 Purchase flows
- iOS IAP verified purchase
- Android IAP verified purchase
- Paddle completed purchase

Each successful purchase should write:
- a `credit_transactions` row
- an `analytics_events` purchase event

### 12.3 Credit consumption flows
When a scan credit is consumed, write:
- a `credit_transactions` consume row
- optionally an analytics event linked to the scan action

### 12.4 Recipe flows
When a recipe is scanned/analyzed/created, write analytics events for:
- scan started
- scan completed
- recipe created

## 13. Backfill Strategy

Backfill what can be reasonably reconstructed from current data.

Possible backfills:
- current total users from `profiles`
- current total recipes from `recipes`
- current outstanding balances from `profiles.credits`
- some historic purchase events from existing webhook/provider references if recoverable

Limitations:
- historical analytics before ledger/event instrumentation may be incomplete
- historical anonymous vs registered snapshots may not be reconstructable with full accuracy
- historical scan started/completed counts may be partial or unavailable

The spec should explicitly label backfilled historic data as best-effort.

## 14. Security Model

- Host the portal at `admin.recipekeeper.org`
- Protect access with Cloudflare Access only
- Keep the portal read-only in v1
- Use server-side Supabase access for admin analytics reads
- Do not expose raw secrets or sensitive identifiers unnecessarily in the UI

## 15. Technical Approach

### 15.1 App structure
Recommended approach:
- keep the admin portal in the same Next.js repo
- add a dedicated admin route group / layout
- support host-based handling for `admin.recipekeeper.org`
- isolate admin navigation and UI shell from the consumer dashboard

### 15.2 Data fetching
- prefer server components for page-level loads
- use server-side queries/RPCs/views for aggregation
- keep filters in URL search params
- build chart/table sections from normalized admin data adapters

### 15.3 Charting
- charts are in scope for v1
- keep the specific charting library undecided in the spec
- choose the library during implementation based on bundle size, styling fit, and maintenance cost

## 16. Non-Goals for V1

Not included in v1:
- recurring subscription analytics
- Stripe analytics
- write actions / manual credit adjustments
- per-user drill-down pages
- export tools unless added later
- anomaly detection automation unless added later

## 17. Implementation Phases

### Phase 1 — analytics foundation
- add `credit_transactions`
- add `analytics_events`
- add rollup views/materialized views
- instrument purchase, consume, scan, and recipe creation flows
- backfill what is safely reconstructable

### Phase 2 — admin portal UI
- add admin app shell
- add overview page
- add revenue & credits page
- add users page
- add recipes & scans page
- add operations page
- add global filtering and chart/table components

### Phase 3 — refinement
- metric definition cleanup
- performance tuning
- improve rollups/materialized views
- add data quality/freshness indicators

## 18. Metric Definitions to Lock Before Build

These should be finalized during implementation so the dashboard remains trustworthy:
- what exactly counts as a "registered user"
- how to identify anonymous-to-registered conversion
- whether "recipe scanned/analyzed" means scan started, scan completed, or successful structured extraction
- whether revenue is exact historical money value or a pack-price proxy for early data
- whether outstanding credits should include all accounts or only active accounts

## 19. Final Recommendation

Proceed with **Option A: analytics foundation first**.

This gives you a dashboard that can be trusted and extended, instead of one that guesses too much from partial historical data.
