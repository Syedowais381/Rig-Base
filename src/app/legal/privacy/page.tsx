import { LegalDocumentShell } from '@/components/marketing/legal-document-shell'

export default function PrivacyPage() {
  return (
    <LegalDocumentShell title="Privacy Policy" updated="June 12, 2026">
      <p>
        This placeholder Privacy Policy describes how Rig Base intends to handle personal and business data. A complete policy will replace this document prior to production launch.
      </p>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Information we collect</h2>
        <p>
          We collect account information (name, email), workspace configuration data, and operational records you enter into the platform. Authentication is handled through our identity provider.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">How we use information</h2>
        <p>
          Data is used to operate your workspace, enforce access controls, provide support, and improve platform reliability. We do not sell personal data to third parties.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Data retention & security</h2>
        <p>
          Workspace data is retained while your account is active. Industry-standard encryption and access controls are applied. Detailed retention schedules will be published in the final policy.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Your rights</h2>
        <p>
          You may request access, correction, or deletion of personal data associated with your account, subject to legal and operational requirements.
        </p>
      </section>
    </LegalDocumentShell>
  )
}
