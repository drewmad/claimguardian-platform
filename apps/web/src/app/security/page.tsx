/**
 * @fileMetadata
 * @purpose "Security page detailing ClaimGuardian's security measures and compliance"
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["SecurityPage"]
 * @complexity medium
 * @tags ["security", "compliance", "trust"]
 * @status stable
 */
import { Metadata } from "next";
import { Shield, Lock, Eye, Server, Database, Users, FileCheck, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Privacy | ClaimGuardian",
  description: "Learn how ClaimGuardian protects your property data with bank-level security, encryption, and privacy controls.",
  keywords: "security, privacy, encryption, data protection, GDPR, SOC2, compliance",
  openGraph: {
    title: "Security & Privacy | ClaimGuardian",
    description: "Bank-level security protecting your property intelligence.",
    url: "https://claimguardianai.com/security",
  },
};

const SecurityFeature = ({ 
  icon: Icon, 
  title, 
  description, 
  details 
}: { 
  icon: any, 
  title: string, 
  description: string, 
  details: string[] 
}) => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-green-400/30 transition-colors">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-green-400/10 rounded-lg">
        <Icon className="w-6 h-6 text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="text-gray-300 mb-4">{description}</p>
    <ul className="space-y-2">
      {details.map((detail, index) => (
        <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
          <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
          {detail}
        </li>
      ))}
    </ul>
  </div>
);

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-400/10 rounded-xl">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Security & Privacy</h1>
              <p className="text-green-400 font-medium">Bank-Level Protection</p>
            </div>
          </div>
          <p className="text-xl text-gray-300 leading-relaxed">
            Your property data deserves the highest level of protection. ClaimGuardian employs 
            enterprise-grade security measures to safeguard your digital twin and ensure your 
            privacy remains under your control.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Security Overview */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">How We Protect Your Data</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            <SecurityFeature
              icon={Lock}
              title="Encryption Everywhere"
              description="All data encrypted in transit and at rest using industry-standard protocols."
              details={[
                "TLS 1.3 for all data transmission",
                "AES-256 encryption for stored data",
                "End-to-end encryption for sensitive documents",
                "Encrypted database backups",
                "Zero-knowledge architecture for personal documents"
              ]}
            />

            <SecurityFeature
              icon={Eye}
              title="Privacy by Design"
              description="You control what's shared. Default settings maximize your privacy."
              details={[
                "Private by default - no data sharing without consent",
                "Granular privacy controls for each data type",
                "Anonymous usage analytics only",
                "No selling of personal information",
                "Right to data portability and deletion"
              ]}
            />

            <SecurityFeature
              icon={Server}
              title="Infrastructure Security"
              description="Hosted on SOC 2 Type II compliant infrastructure with 99.9% uptime."
              details={[
                "AWS/Google Cloud enterprise hosting",
                "Multi-region data redundancy",
                "Automated security monitoring",
                "Regular penetration testing",
                "24/7 security incident response"
              ]}
            />

            <SecurityFeature
              icon={Database}
              title="Data Protection"
              description="Multiple layers of protection ensure your property data stays secure."
              details={[
                "Regular automated backups",
                "Point-in-time recovery capabilities",
                "Data residency controls (US-based)",
                "Audit logs for all data access",
                "GDPR and CCPA compliance ready"
              ]}
            />

            <SecurityFeature
              icon={Users}
              title="Access Controls"
              description="Strict access controls ensure only authorized personnel handle your data."
              details={[
                "Multi-factor authentication required",
                "Role-based access control (RBAC)",
                "Least privilege principle",
                "Regular access reviews and audits",
                "Background checks for all staff"
              ]}
            />

            <SecurityFeature
              icon={FileCheck}
              title="Compliance & Audits"
              description="Regular third-party security audits and compliance certifications."
              details={[
                "Annual security audits by certified firms",
                "SOC 2 Type II compliance (in progress)",
                "GDPR and CCPA compliant data handling",
                "Regular vulnerability assessments",
                "Incident response plan tested quarterly"
              ]}
            />

          </div>
        </section>

        {/* Data Processing */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Data Processing & Storage</h2>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">What We Store</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Property information you provide</li>
                  <li>• Photos and documents you upload</li>
                  <li>• AI analysis results and insights</li>
                  <li>• Account and billing information</li>
                  <li>• Usage analytics (anonymized)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">What We Don't Store</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Credit card information (Stripe handles)</li>
                  <li>• Social security numbers</li>
                  <li>• Unnecessary personal identifiers</li>
                  <li>• Browsing history outside our platform</li>
                  <li>• Location data (unless explicitly provided)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Third-Party Subprocessors</h2>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8">
            <p className="text-gray-300 mb-6">
              We work with trusted partners who meet our security standards:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-2">Infrastructure</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Vercel (Hosting & CDN)</li>
                  <li>• Supabase (Database & Auth)</li>
                  <li>• AWS (Storage & Processing)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Services</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Stripe (Payment Processing)</li>
                  <li>• OpenAI (AI Processing)</li>
                  <li>• Resend (Transactional Email)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Incident Response */}
        <section className="mb-16">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Security Incident Response</h3>
                <p className="text-gray-300 mb-4">
                  In the unlikely event of a security incident, we have a comprehensive response plan:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li>• Immediate containment and assessment</li>
                  <li>• Notification within 72 hours (as required by law)</li>
                  <li>• Transparent communication about impact and resolution</li>
                  <li>• Post-incident review and security improvements</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-8">Questions About Security?</h2>
          <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-8">
            <p className="text-gray-300 mb-4">
              We're committed to transparency about our security practices. If you have questions 
              about how we protect your data or want to report a security concern:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:security@claimguardianai.com" 
                className="inline-flex items-center gap-2 bg-green-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-300 transition-colors"
              >
                Contact Security Team
              </a>
              <a 
                href="mailto:support@claimguardianai.com?subject=Security Question" 
                className="inline-flex items-center gap-2 border border-green-400/30 text-green-400 px-6 py-3 rounded-lg font-semibold hover:bg-green-400/10 transition-colors"
              >
                General Support
              </a>
            </div>
          </div>
        </section>

      </div>

      {/* Footer Note */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-400 text-center">
            This security page was last updated on January 7, 2025. We continuously review and 
            improve our security measures to protect your property intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}