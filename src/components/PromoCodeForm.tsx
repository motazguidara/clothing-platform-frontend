"use client";

import React from "react";
import { useCoupon } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";

type Props = {
  onApplied: (code: string, discountPercent: number) => void;
};

export default function PromoCodeForm({ onApplied }: Props) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const { refetch, isFetching } = useCoupon(code || undefined);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await refetch();
      if (r.error) throw r.error as any;
      const data: any = r.data;
      if (!data) throw new Error("Invalid coupon");
      onApplied(code, data.discount);
    } catch (err: any) {
      setError(err?.message || "Invalid coupon");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code"
        aria-label="Promo code"
        className="flex-1 border border-border rounded-md px-3 py-2"
      />
      <Button type="submit" disabled={!code || isFetching}>Apply</Button>
      {error && <span className="sr-only" role="alert">{error}</span>}
    </form>
  );
}
