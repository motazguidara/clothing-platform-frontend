type Props = { params: { category: string } };

export default function CategoryPage({ params }: Props) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Category: {decodeURIComponent(params.category)}</h1>
      <p className="text-muted mt-2">Category landing (placeholder).</p>
    </section>
  );
}



