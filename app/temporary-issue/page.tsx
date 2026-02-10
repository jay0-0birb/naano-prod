import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temporary issue",
};

export default function TemporaryIssuePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-[#111827]">
          Something went wrong
        </h1>
        <p className="mb-4 text-sm text-[#64748B]">
          We&apos;re currently experiencing a temporary issue and are working to
          resolve it. Please try again in a little while.
        </p>
      </section>
    </main>
  );
}

