import { LegalDocumentShell } from '@/components/marketing/legal-document-shell'

export default function CookiesPage() {
  return (
    <LegalDocumentShell title="Cookie Policy" updated="June 12, 2026">
      <p>
        This placeholder Cookie Policy explains how Rig Base uses cookies and similar technologies. Final cookie practices will be documented here before launch.
      </p>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Essential cookies</h2>
        <p>
          We use session and authentication cookies required to keep you signed in and to protect your workspace. These cannot be disabled while using the application.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Preference cookies</h2>
        <p>
          Optional cookies may remember interface preferences such as sidebar state. Details on preference storage will be updated in the final policy.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Managing cookies</h2>
        <p>
          You can control non-essential cookies through your browser settings. Disabling essential cookies may prevent the platform from functioning correctly.
        </p>
      </section>
    </LegalDocumentShell>
  )
}
