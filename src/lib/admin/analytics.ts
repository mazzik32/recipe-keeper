import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export type AdminGranularity = 'hour' | 'day' | 'week' | 'month' | 'year';
export type AdminChannel = 'all' | 'ios' | 'android' | 'paddle-web';
export type AdminUserType = 'all' | 'anonymous' | 'registered';
export type AdminPackCode = 'all' | 'pack_20' | 'pack_50' | 'pack_200' | 'org.recipekeeper.credits.20' | 'org.recipekeeper.credits.50' | 'org.recipekeeper.credits.200' | 'org.recipekeeper.credits.400';

export interface AdminFilters {
  from: string;
  to: string;
  granularity: AdminGranularity;
  channel: AdminChannel;
  userType: AdminUserType;
  packCode: AdminPackCode;
}

export interface AdminKpiData {
  totalUsers: number;
  anonymousUsers: number;
  registeredUsers: number;
  newUsersInRange: number;
  totalRecipes: number;
  recipesCreatedInRange: number;
  scansCompletedInRange: number;
  creditsPurchasedInRange: number;
  creditsConsumedInRange: number;
  outstandingCredits: number;
  totalTransactionsInRange: number;
}

export interface TrendPoint {
  bucket: string;
  users: number;
  recipes: number;
  scansCompleted: number;
  creditsPurchased: number;
  creditsConsumed: number;
}

export interface BreakdownRow {
  label: string;
  value: number;
}

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type CreditTransactionRow = Database['public']['Tables']['credit_transactions']['Row'];
type AnalyticsEventRow = Database['public']['Tables']['analytics_events']['Row'];
type WebhookEventRow = Database['public']['Tables']['webhook_events']['Row'];

type AdminIdentityMap = Record<string, { email: string | null }>;

export interface AdminDashboardData {
  filters: AdminFilters;
  kpis: AdminKpiData;
  trends: TrendPoint[];
  channelBreakdown: BreakdownRow[];
  packBreakdown: BreakdownRow[];
  recentPurchases: Array<{ id: string; createdAt: string; source: string; packCode: string | null; amount: number; userType: string; userEmail: string | null }>;
  highestBalances: Array<{ id: string; displayName: string | null; email: string | null; credits: number; createdAt: string }>;
  recentRecipes: Array<{ id: string; title: string; createdAt: string; userId: string; userEmail: string | null }>;
  recentScans: Array<{ id: string; occurredAt: string; channel: string | null; userType: string; mode: string | null; userEmail: string | null }>;
  recentOperations: Array<{ id: string; provider: string; eventId: string; receivedAt: string }>;
  purchaseEventsInRange: number;
  anonymousSessionsInRange: number;
  registeredEventsInRange: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getDefaultFilters(searchParams?: Record<string, string | string[] | undefined>): AdminFilters {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - 30);

  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const granularity = first(searchParams?.granularity) as AdminGranularity | undefined;
  const channel = first(searchParams?.channel) as AdminChannel | undefined;
  const userType = first(searchParams?.userType) as AdminUserType | undefined;
  const packCode = first(searchParams?.packCode) as AdminPackCode | undefined;

  return {
    from: first(searchParams?.from) ?? past.toISOString(),
    to: first(searchParams?.to) ?? now.toISOString(),
    granularity: ['hour', 'day', 'week', 'month', 'year'].includes(granularity ?? '') ? granularity! : 'day',
    channel: ['all', 'ios', 'android', 'paddle-web'].includes(channel ?? '') ? channel! : 'all',
    userType: ['all', 'anonymous', 'registered'].includes(userType ?? '') ? userType! : 'all',
    packCode: packCode ?? 'all',
  };
}

function normalizeSourceToChannel(source: string | null): AdminChannel | 'other' {
  if (source === 'iap_ios') return 'ios';
  if (source === 'iap_android') return 'android';
  if (source === 'paddle') return 'paddle-web';
  return 'other';
}

function bucketDate(date: string, granularity: AdminGranularity): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;

  if (granularity === 'hour') {
    value.setMinutes(0, 0, 0);
  } else if (granularity === 'day') {
    value.setHours(0, 0, 0, 0);
  } else if (granularity === 'week') {
    const day = value.getDay();
    const diff = (day + 6) % 7;
    value.setDate(value.getDate() - diff);
    value.setHours(0, 0, 0, 0);
  } else if (granularity === 'month') {
    value.setDate(1);
    value.setHours(0, 0, 0, 0);
  } else {
    value.setMonth(0, 1);
    value.setHours(0, 0, 0, 0);
  }

  return value.toISOString();
}

function inRange(value: string, filters: AdminFilters) {
  return value >= filters.from && value <= filters.to;
}

async function getIdentityMap(userIds: string[]): Promise<AdminIdentityMap> {
  if (userIds.length === 0) return {};

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      apikey: supabaseServiceKey!,
      Authorization: `Bearer ${supabaseServiceKey!}`,
    },
  });

  if (!response.ok) {
    console.warn('Failed to fetch admin user identities');
    return {};
  }

  const data = await response.json() as { users?: Array<{ id: string; email?: string | null }> };
  const requested = new Set(userIds);
  return (data.users ?? []).reduce<AdminIdentityMap>((acc, user) => {
    if (requested.has(user.id)) {
      acc[user.id] = { email: user.email ?? null };
    }
    return acc;
  }, {});
}

export async function getAdminDashboardData(filters: AdminFilters): Promise<AdminDashboardData> {
  const supabase = getAdminClient();

  const [profilesResult, recipesResult, creditResult, eventResult, webhookResult] = await Promise.all([
    supabase.from('profiles').select('id, display_name, credits, created_at'),
    supabase.from('recipes').select('id, user_id, title, created_at'),
    supabase.from('credit_transactions').select('id, user_id, direction, amount, source, pack_code, user_type_snapshot, created_at'),
    supabase.from('analytics_events').select('id, event_name, user_id, user_type_snapshot, channel, recipe_id, event_key, metadata, occurred_at').order('occurred_at', { ascending: false }),
    supabase.from('webhook_events').select('id, provider, event_id, received_at').order('received_at', { ascending: false }).limit(25),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (recipesResult.error) throw recipesResult.error;
  if (creditResult.error) throw creditResult.error;
  if (eventResult.error) throw eventResult.error;
  if (webhookResult.error) throw webhookResult.error;

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const recipes = (recipesResult.data ?? []) as Pick<RecipeRow, 'id' | 'user_id' | 'title' | 'created_at'>[];
  const allCreditTransactions = (creditResult.data ?? []) as Pick<CreditTransactionRow, 'id' | 'user_id' | 'direction' | 'amount' | 'source' | 'pack_code' | 'user_type_snapshot' | 'created_at'>[];
  const allEvents = (eventResult.data ?? []) as Pick<AnalyticsEventRow, 'id' | 'event_name' | 'user_id' | 'user_type_snapshot' | 'channel' | 'recipe_id' | 'event_key' | 'metadata' | 'occurred_at'>[];
  const webhookEvents = (webhookResult.data ?? []) as WebhookEventRow[];

  const creditTransactions = allCreditTransactions.filter((item) => {
    const channel = normalizeSourceToChannel(item.source);
    const matchesChannel = filters.channel === 'all' || channel === filters.channel;
    const matchesUserType = filters.userType === 'all' || item.user_type_snapshot === filters.userType;
    const matchesPack = filters.packCode === 'all' || item.pack_code === filters.packCode;
    return matchesChannel && matchesUserType && matchesPack;
  });
  const events = allEvents.filter((item) => {
    const matchesChannel = filters.channel === 'all' || item.channel === filters.channel;
    const matchesUserType = filters.userType === 'all' || item.user_type_snapshot === filters.userType;
    return matchesChannel && matchesUserType;
  });

  const purchaseTransactionsInRange = creditTransactions.filter((item) => item.direction === 'grant' && inRange(item.created_at, filters));
  const consumeTransactionsInRange = creditTransactions.filter((item) => item.direction === 'consume' && inRange(item.created_at, filters));
  const scansCompletedInRange = events.filter((item) => item.event_name === 'recipe_scan_completed' && inRange(item.occurred_at, filters));
  const recipesCreatedInRange = recipes.filter((item) => inRange(item.created_at, filters));
  const usersInRange = profiles.filter((item) => inRange(item.created_at, filters));

  const identityMap = await getIdentityMap(Array.from(new Set([
    ...profiles.map((item) => item.id),
    ...purchaseTransactionsInRange.map((item) => item.user_id),
    ...recipesCreatedInRange.map((item) => item.user_id),
    ...scansCompletedInRange.map((item) => item.user_id).filter((value): value is string => Boolean(value)),
  ])));

  const trendMap = new Map<string, TrendPoint>();
  const ensureTrend = (bucket: string) => {
    const existing = trendMap.get(bucket);
    if (existing) return existing;
    const point: TrendPoint = { bucket, users: 0, recipes: 0, scansCompleted: 0, creditsPurchased: 0, creditsConsumed: 0 };
    trendMap.set(bucket, point);
    return point;
  };

  usersInRange.forEach((item) => ensureTrend(bucketDate(item.created_at, filters.granularity)).users += 1);
  recipesCreatedInRange.forEach((item) => ensureTrend(bucketDate(item.created_at, filters.granularity)).recipes += 1);
  purchaseTransactionsInRange.forEach((item) => ensureTrend(bucketDate(item.created_at, filters.granularity)).creditsPurchased += item.amount);
  consumeTransactionsInRange.forEach((item) => ensureTrend(bucketDate(item.created_at, filters.granularity)).creditsConsumed += item.amount);
  scansCompletedInRange.forEach((item) => ensureTrend(bucketDate(item.occurred_at, filters.granularity)).scansCompleted += 1);

  const channelBreakdownMap = new Map<string, number>();
  purchaseTransactionsInRange.forEach((item) => {
    const label = normalizeSourceToChannel(item.source);
    channelBreakdownMap.set(label, (channelBreakdownMap.get(label) ?? 0) + item.amount);
  });

  const packBreakdownMap = new Map<string, number>();
  purchaseTransactionsInRange.forEach((item) => {
    const label = item.pack_code ?? 'unknown';
    packBreakdownMap.set(label, (packBreakdownMap.get(label) ?? 0) + item.amount);
  });

  const anonymousUsers = events.filter((item) => item.user_type_snapshot === 'anonymous' && item.event_name === 'anonymous_session_created').length || profiles.filter((profile) => profile.display_name === null).length;
  const registeredEvents = events.filter((item) => item.event_name === 'user_registered');

  return {
    filters,
    kpis: {
      totalUsers: profiles.length,
      anonymousUsers,
      registeredUsers: Math.max(profiles.length - anonymousUsers, 0),
      newUsersInRange: usersInRange.length,
      totalRecipes: recipes.length,
      recipesCreatedInRange: recipesCreatedInRange.length,
      scansCompletedInRange: scansCompletedInRange.length,
      creditsPurchasedInRange: purchaseTransactionsInRange.reduce((sum, item) => sum + item.amount, 0),
      creditsConsumedInRange: consumeTransactionsInRange.reduce((sum, item) => sum + item.amount, 0),
      outstandingCredits: profiles.reduce((sum, item) => sum + item.credits, 0),
      totalTransactionsInRange: purchaseTransactionsInRange.length + consumeTransactionsInRange.length,
    },
    trends: Array.from(trendMap.values()).sort((a, b) => a.bucket.localeCompare(b.bucket)),
    channelBreakdown: Array.from(channelBreakdownMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    packBreakdown: Array.from(packBreakdownMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    recentPurchases: purchaseTransactionsInRange.slice(0, 10).map((item) => ({
      id: item.id,
      createdAt: item.created_at,
      source: item.source,
      packCode: item.pack_code,
      amount: item.amount,
      userType: item.user_type_snapshot,
      userEmail: identityMap[item.user_id]?.email ?? null,
    })),
    highestBalances: [...profiles].sort((a, b) => b.credits - a.credits).slice(0, 10).map((item) => ({
      id: item.id,
      displayName: item.display_name,
      email: identityMap[item.id]?.email ?? null,
      credits: item.credits,
      createdAt: item.created_at,
    })),
    recentRecipes: [...recipes].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10).map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: item.created_at,
      userId: item.user_id,
      userEmail: identityMap[item.user_id]?.email ?? null,
    })),
    recentScans: scansCompletedInRange.slice(0, 10).map((item) => ({
      id: item.id,
      occurredAt: item.occurred_at,
      channel: item.channel,
      userType: item.user_type_snapshot,
      mode: typeof item.metadata === 'object' && item.metadata && 'mode' in item.metadata ? String(item.metadata.mode) : null,
      userEmail: item.user_id ? identityMap[item.user_id]?.email ?? null : null,
    })),
    recentOperations: webhookEvents.map((item) => ({
      id: String(item.id),
      provider: item.provider,
      eventId: item.event_id,
      receivedAt: item.received_at,
    })),
    purchaseEventsInRange: purchaseTransactionsInRange.length,
    anonymousSessionsInRange: events.filter((item) => item.event_name === 'anonymous_session_created' && inRange(item.occurred_at, filters)).length,
    registeredEventsInRange: registeredEvents.filter((item) => inRange(item.occurred_at, filters)).length,
  };
}
