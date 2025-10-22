import { OrderDetailPageClient } from "./page.client";

type OrderPageParams = { id: string };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<OrderPageParams>;
}) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id ?? "";
  const id = decodeURIComponent(rawId);

  return <OrderDetailPageClient orderId={id} />;
}
