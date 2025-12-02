"use client";

import React from "react";
import { useCoupon, type Coupon } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui";

type Props = {
  onApplied: (coupon: Coupon) => void;
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
      onApplied(data as Coupon);
    } catch (err: any) {
      setError(err?.message || "Invalid coupon");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2" noValidate>
      <FormField label="Promo code" hint="Enter a discount code if you have one.">
        <Input
          name="promo"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
        />
      </FormField>
      <Button type="submit" disabled={!code || isFetching}>Apply</Button>
      {error && <span className="text-sm text-red-600" role="alert">{error}</span>}
    </form>
  );
}
