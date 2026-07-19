import Link from "next/link";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/config/routes";

const SALES_EMAIL = "sales@blockmec.com";
const SALES_PHONE = "+234 700 000 0000";

export default function ContactSalesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#100f18] via-[#171323] to-[#100f18] text-white px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href={ROUTES.DASHBOARD.DEVELOPER}
            className="text-sm text-purple-300 hover:text-purple-200 underline underline-offset-4"
          >
            Back to Developer Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Contact Sales
          </h1>
          <p className="mt-2 text-gray-300">
            Reach our enterprise team for custom plans, high-volume credits,
            dedicated onboarding, and SLA-backed support.
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-[#2a2139] bg-[#1b1728] p-6">
            <div className="mb-3 flex items-center gap-2 text-purple-300">
              <Mail className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Email Sales</h2>
            </div>
            <p className="text-sm text-gray-300">
              Send your requirements and expected monthly verification volume.
            </p>
            <a
              href={`mailto:${SALES_EMAIL}?subject=Enterprise%20Plan%20Inquiry`}
              className="mt-4 inline-flex rounded-md bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700"
            >
              {SALES_EMAIL}
            </a>
          </article>

          <article className="rounded-2xl border border-[#2a2139] bg-[#1b1728] p-6">
            <div className="mb-3 flex items-center gap-2 text-purple-300">
              <Phone className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Call Sales</h2>
            </div>
            <p className="text-sm text-gray-300">
              Speak directly to our enterprise advisor during business hours.
            </p>
            <a
              href={`tel:${SALES_PHONE.replace(/\s+/g, "")}`}
              className="mt-4 inline-flex rounded-md border border-purple-500 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/10"
            >
              {SALES_PHONE}
            </a>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-[#2a2139] bg-[#1b1728] p-6">
          <div className="mb-3 flex items-center gap-2 text-purple-300">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Enterprise Features</h2>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Dedicated API throughput and webhook scaling support</li>
            <li>Custom credit bundles and annual billing options</li>
            <li>Priority incident response and onboarding assistance</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
