"use client";

import Link from "next/link";
import { useLoyalty } from "@/hooks/useLoyalty";

const TIERS = [
  { name: "Bronze", threshold: 0, perk: "Welcome perks & early drops" },
  { name: "Silver", threshold: 500, perk: "Early access + birthday rewards" },
  { name: "Gold", threshold: 1000, perk: "Free tailoring & priority support" },
  { name: "Platinum", threshold: 2000, perk: "VIP styling and exclusive drops" },
];

export default function LoyaltyPage() {
  const { data, isLoading, isError, refetch, isFetching } = useLoyalty();

  const currentTier = data?.tier || "Bronze";
  const balance = data?.points_balance ?? 0;
  const nextTier = TIERS.find((tier) => tier.threshold > balance);
  const currentTierMeta = TIERS.filter((tier) => tier.threshold <= balance).pop() ?? TIERS[0];

  const nextProgress = nextTier
    ? Math.min(100, Math.round((balance / nextTier.threshold) * 100))
    : 100;

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-amber-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <header className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-amber-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Loyalty</p>
                <h1 className="text-3xl font-extrabold text-gray-900">Your Points Wallet</h1>
                <p className="text-sm text-gray-600">
                  Earn 1 point for every 5 TND you spend. Each point is worth 0.20 TND at checkout.
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                <div className="text-sm text-gray-500">Current tier</div>
                <div className="text-2xl font-semibold text-amber-600">{currentTier}</div>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="text-sm text-gray-500">Points balance</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{balance.toLocaleString()} pts</div>
              {data?.lifetime_points ? (
                <div className="text-xs text-gray-500">Lifetime: {data.lifetime_points.toLocaleString()} pts</div>
              ) : null}
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="text-sm text-gray-500">Next tier</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">
                {nextTier ? `${nextTier.name} in ${Math.max(nextTier.threshold - balance, 0)} pts` : "Max tier reached"}
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                  style={{ width: `${nextTier ? nextProgress : 100}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="text-sm text-gray-500">Perks</div>
              <div className="mt-2 text-base font-semibold text-gray-900">{currentTierMeta.perk}</div>
              <Link
                href="/catalog"
                className="mt-3 inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700"
              >
                Shop to earn →
              </Link>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">How to earn</h2>
                <p className="text-sm text-gray-600">Collect points automatically whenever your orders are paid.</p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-sm font-semibold text-amber-600 hover:text-amber-700"
                disabled={isFetching}
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Checkout", body: "Complete a paid order to bank points automatically." },
                { title: "Stack with coupons", body: "Use discount codes and still earn points on the paid subtotal." },
                { title: "Redeem soon", body: "We’re rolling out redemption in the next sprint. Points accrue now." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-dashed border-amber-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.body}</div>
                </div>
              ))}
            </div>
            {isLoading && <div className="mt-4 text-sm text-gray-500">Loading your balance…</div>}
            {isError && (
              <div className="mt-4 text-sm text-red-600">
                Could not load loyalty balance. Please sign in and try again.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
