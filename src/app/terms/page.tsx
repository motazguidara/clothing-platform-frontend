import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | Clothing",
  description:
    "Read the terms and conditions that govern your use of the Clothing platform, including account responsibilities, orders, returns, and privacy commitments.",
};

const sections: Array<{
  title: string;
  body: React.ReactNode;
}> = [
  {
    title: "1. Acceptance of These Terms",
    body: (
      <p>
        By accessing or using the Clothing website, mobile applications, or related
        services (collectively, the “Services”), you agree to be bound by these Terms &amp;
        Conditions (“Terms”) and our&nbsp;
        <Link href="/privacy" className="underline transition-colors hover:text-black">
          Privacy Policy
        </Link>
        . If you do not agree, do not use the Services. These Terms apply to all users,
        including registered customers, guests, and visitors.
      </p>
    ),
  },
  {
    title: "2. Eligibility & Account Responsibilities",
    body: (
      <ul className="space-y-2 list-disc pl-6">
        <li>You must be at least 16 years old to create an account with Clothing.</li>
        <li>
          You are responsible for safeguarding your login credentials and for all activity
          that occurs under your account.
        </li>
        <li>
          Notify us immediately at support@clothing.co if you suspect unauthorized use of
          your account.
        </li>
      </ul>
    ),
  },
  {
    title: "3. Orders, Pricing & Payment",
    body: (
      <ul className="space-y-2 list-disc pl-6">
        <li>
          All prices are shown in the currency specified at checkout and include applicable
          taxes unless otherwise noted.
        </li>
        <li>
          An order is accepted once you receive a confirmation email from Clothing. We
          reserve the right to refuse or cancel any order at our discretion.
        </li>
        <li>
          Payment is processed securely via our approved payment partners. By submitting an
          order, you warrant that you are authorized to use the selected payment method.
        </li>
      </ul>
    ),
  },
  {
    title: "4. Shipping, Returns & Refunds",
    body: (
      <ul className="space-y-2 list-disc pl-6">
        <li>
          Estimated delivery times are provided at checkout. Actual timelines may vary due to
          carrier delays or customs inspections.
        </li>
        <li>
          You may return eligible items within 30 days of delivery. Items must be unused,
          unworn, and in original packaging with tags attached.
        </li>
        <li>
          Refunds are issued to the original payment method after the returned items pass
          inspection. Shipping fees are non-refundable unless required by law.
        </li>
      </ul>
    ),
  },
  {
    title: "5. Promotions & Gift Cards",
    body: (
      <ul className="space-y-2 list-disc pl-6">
        <li>
          Promotional codes and gift cards are subject to additional terms stated at the time
          of issuance and may not be combinable.
        </li>
        <li>
          Promotions cannot be applied retroactively to previous purchases.
        </li>
        <li>
          Clothing reserves the right to modify or cancel promotions at any time.
        </li>
      </ul>
    ),
  },
  {
    title: "6. Intellectual Property",
    body: (
      <p>
        All content on the Services—including designs, graphics, logos, and text—is owned by
        Clothing or its licensors and is protected by intellectual property laws. You may
        not reproduce, distribute, or create derivative works without our express written
        consent.
      </p>
    ),
  },
  {
    title: "7. User Content & Conduct",
    body: (
      <ul className="space-y-2 list-disc pl-6">
        <li>
          You are solely responsible for content you submit (e.g., product reviews). Do not
          post content that is unlawful, defamatory, or infringes the rights of others.
        </li>
        <li>
          We may remove content or suspend accounts that violate these Terms or applicable
          law.
        </li>
      </ul>
    ),
  },
  {
    title: "8. Limitation of Liability",
    body: (
      <p>
        To the fullest extent permitted by law, Clothing shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising out of or related to
        your use of the Services. Our total liability for any claim shall not exceed the
        amount you paid to Clothing for the purchase that gave rise to the claim.
      </p>
    ),
  },
  {
    title: "9. Privacy & Data Protection",
    body: (
      <p>
        We process personal data in accordance with our{" "}
        <Link href="/privacy" className="underline transition-colors hover:text-black">
          Privacy Policy
        </Link>
        . By using the Services, you consent to our collection and use of personal
        information as outlined therein.
      </p>
    ),
  },
  {
    title: "10. Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time to reflect changes to our practices or
        for legal reasons. When we do, we will update the “Last Updated” date at the top of
        this page. Your continued use of the Services after changes become effective
        constitutes acceptance of the revised Terms.
      </p>
    ),
  },
  {
    title: "11. Contact Us",
    body: (
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:support@clothing.co" className="underline transition-colors hover:text-black">
          support@clothing.co
        </a>{" "}
        or by mail at Clothing HQ, 123 Style Avenue, London, UK.
      </p>
    ),
  },
];

export default function TermsPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12 space-y-3">
        <p className="text-sm uppercase tracking-wide text-gray-500">Clothing</p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500">Last updated: 8 October 2025</p>
        <p className="text-gray-600">
          Thank you for choosing Clothing. These Terms outline the rules and expectations when you
          shop with us. Please read them carefully before using our Services.
        </p>
      </header>

      <section className="space-y-12 text-gray-700">
        {sections.map((section) => (
          <article key={section.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            <div className="space-y-3 leading-relaxed">{section.body}</div>
          </article>
        ))}
      </section>

      <footer className="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-500">
        <p>
          By continuing to use Clothing, you acknowledge that you have read, understood, and agree
          to be bound by these Terms. For further assistance, please contact our support team.
        </p>
      </footer>
    </main>
  );
}
