import { LegalDocumentShell } from '@/components/marketing/legal-document-shell'

export default function TermsPage() {
  return (
    <LegalDocumentShell title="Terms & Conditions" updated="June 12, 2026">
      <p>
        This is a placeholder Terms & Conditions document for Rig Base. Final legal language will be published here before general availability.
      </p>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">1. Acceptance of terms</h2>
        <p>
          By accessing or using Rig Base, you agree to be bound by these terms. If you do not agree, you may not use the platform.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">2. Use of the service</h2>
        <p>
          Rig Base provides workspace-based ERP tools for business operations. You are responsible for the accuracy of data entered into your workspace and for managing user access within your organization.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">3. Accounts & security</h2>
        <p>
          You must keep login credentials confidential and notify us of unauthorized access. We may suspend accounts that violate these terms or pose a security risk.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">4. Limitation of liability</h2>
        <p>
          Rig Base is provided on an as-is basis during this preview period. Liability limitations and warranty disclaimers will be defined in the final published version of this document.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">5. Contact</h2>
        <p>
          Questions about these terms may be directed through the contact channels listed on the Rig Base website footer.
        </p>
      </section>
    </LegalDocumentShell>
  )
}
