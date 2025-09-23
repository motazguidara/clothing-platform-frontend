type Props = { params: { id: string } };

export default function OrderDetailPage({ params }: Props) {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Order #{params.id}</h1>
      <p className="text-muted mt-2">Order details placeholder.</p>
    </section>
  );
}



