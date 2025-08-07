/**
 * @fileMetadata
 * @purpose "Public features overview page showcasing ClaimGuardian capabilities"
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["FeaturesPage"]
 * @complexity medium
 * @tags ["features", "marketing", "public"]
 * @status stable
 */
import { Metadata } from "next";
import Link from "next/link";
import { 
  Shield, 
  Brain, 
  Camera, 
  FileText, 
  Zap, 
  Users, 
  Clock, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Cloud,
  Lock,
  BarChart3
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features | ClaimGuardian - AI-Powered Property Intelligence",
  description: "Discover ClaimGuardian's AI features: damage analysis, inventory scanning, policy chat, and settlement optimization. See how AI protects your property.",
  keywords: "AI property protection, damage analysis, inventory scanner, policy chat, claim optimization, Florida insurance",
  openGraph: {
    title: "ClaimGuardian Features - AI Property Intelligence",
    description: "AI Damage Analysis, Smart Inventory, Policy Chat, and Settlement Optimization. See all features.",
    url: "https://claimguardianai.com/features",
  },
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  benefits,
  comingSoon = false,
  demoUrl 
}: { 
  icon: any, 
  title: string, 
  description: string, 
  benefits: string[],
  comingSoon?: boolean,
  demoUrl?: string
}) => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-green-400/30 transition-all duration-300 hover:transform hover:scale-105">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-green-400/10 rounded-lg">
        <Icon className="w-6 h-6 text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {comingSoon && (
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
            Coming Soon
          </span>
        )}
      </div>
    </div>
    <p className="text-gray-300 mb-4">{description}</p>
    <ul className="space-y-2 mb-6">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          {benefit}
        </li>
      ))}
    </ul>
    {demoUrl && (
      <Link
        href={demoUrl}
        className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium"
      >
        Try Feature
        <ArrowRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

const FeatureSection = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
  <section className="mb-16">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">{description}</p>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </section>
);

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-400/20 text-green-400 border border-green-400/30 mb-6">
              🤖 AI-Powered · 🏠 Property Intelligence · 🌀 Hurricane Ready
            </span>
            <h1 className="text-5xl font-bold mb-6">
              Features That Protect Your Property
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
              From AI damage analysis to smart policy optimization, ClaimGuardian provides 
              the tools Florida property owners need to document, protect, and recover.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup?plan=free"
                className="inline-flex items-center gap-2 bg-green-400 text-black px-8 py-4 rounded-lg font-semibold hover:bg-green-300 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo-v2"
                className="inline-flex items-center gap-2 border border-green-400/30 text-green-400 px-8 py-4 rounded-lg font-semibold hover:bg-green-400/10 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        
        {/* AI Tools */}
        <FeatureSection
          title="AI-Powered Analysis Tools"
          description="Advanced AI that understands property damage, inventory, and insurance policies"
        >
          <FeatureCard
            icon={Camera}
            title="AI Damage Analyzer"
            description="Upload photos and get instant AI analysis of property damage with detailed repair estimates."
            benefits={[
              "Identifies damage types from photos",
              "Provides repair cost estimates",
              "Flags missing evidence",
              "Generates professional reports"
            ]}
            demoUrl="/auth/signup"
          />

          <FeatureCard
            icon={BarChart3}
            title="Inventory Scanner"
            description="AI-powered home inventory management with barcode scanning and value tracking."
            benefits={[
              "Barcode scanning for quick entry",
              "AI-powered item categorization",
              "Depreciation tracking",
              "Insurance value calculations"
            ]}
            demoUrl="/auth/signup"
          />

          <FeatureCard
            icon={Brain}
            title="Policy Chat"
            description="Chat with AI about your insurance policies. Ask questions, get explanations, find coverage gaps."
            benefits={[
              "Natural language policy analysis",
              "Coverage gap identification",
              "Claims eligibility checking",
              "Policy comparison tools"
            ]}
            demoUrl="/auth/signup"
          />

          <FeatureCard
            icon={FileText}
            title="Document Generator"
            description="AI creates professional claim documents, letters, and reports tailored to your situation."
            benefits={[
              "Automated claim documentation",
              "Professional letter templates",
              "Evidence organization",
              "Export in multiple formats"
            ]}
            demoUrl="/auth/signup"
          />

          <FeatureCard
            icon={DollarSign}
            title="Settlement Analyzer"
            description="AI analyzes settlement offers to ensure fair compensation based on similar claims."
            benefits={[
              "Fair value analysis",
              "Market comparison data",
              "Negotiation strategies",
              "Settlement optimization"
            ]}
            demoUrl="/auth/signup"
          />

          <FeatureCard
            icon={Shield}
            title="Evidence Organizer"
            description="Keep all your claim evidence organized, tagged, and easily accessible when you need it."
            benefits={[
              "Drag-and-drop organization",
              "Smart tagging system",
              "Secure cloud storage",
              "Quick search and retrieval"
            ]}
            demoUrl="/auth/signup"
          />
        </FeatureSection>

        {/* Property Management */}
        <FeatureSection
          title="Smart Property Management"
          description="Complete property intelligence and management tools"
        >
          <FeatureCard
            icon={Smartphone}
            title="Mobile Documentation"
            description="Document damage and inventory on-the-go with our mobile-optimized tools."
            benefits={[
              "Camera integration",
              "GPS location tagging",
              "Offline capability",
              "Instant sync to cloud"
            ]}
          />

          <FeatureCard
            icon={Clock}
            title="Maintenance Tracking"
            description="Track property maintenance, warranties, and replacement schedules."
            benefits={[
              "Maintenance reminders",
              "Warranty expiration alerts",
              "Service provider contacts",
              "Maintenance history logs"
            ]}
            comingSoon={true}
          />

          <FeatureCard
            icon={Users}
            title="Team Collaboration"
            description="Share property access with family, property managers, or contractors."
            benefits={[
              "Role-based permissions",
              "Activity tracking",
              "Secure sharing",
              "Comment and annotation tools"
            ]}
            comingSoon={true}
          />
        </FeatureSection>

        {/* Security & Platform */}
        <FeatureSection
          title="Security & Platform Features"
          description="Enterprise-grade security and reliability you can trust"
        >
          <FeatureCard
            icon={Lock}
            title="Bank-Level Security"
            description="Your property data is protected with enterprise-grade security and encryption."
            benefits={[
              "AES-256 encryption",
              "SOC 2 compliance",
              "Regular security audits",
              "Privacy by design"
            ]}
            demoUrl="/security"
          />

          <FeatureCard
            icon={Cloud}
            title="Reliable Cloud Storage"
            description="99.9% uptime with automatic backups and multi-region redundancy."
            benefits={[
              "Automatic cloud sync",
              "Multi-region backups",
              "99.9% uptime SLA",
              "Data export options"
            ]}
          />

          <FeatureCard
            icon={Zap}
            title="Fast Performance"
            description="Lightning-fast AI processing and real-time updates across all your devices."
            benefits={[
              "Sub-second AI responses",
              "Real-time sync",
              "Mobile optimization",
              "Offline capabilities"
            ]}
          />
        </FeatureSection>

        {/* Integration Showcase */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-green-400/10 to-blue-500/10 border border-green-400/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Complete Property Intelligence Platform
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              All features work together to create a comprehensive view of your property, 
              from initial documentation to claim resolution and beyond.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-400/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-sm text-gray-300">Document</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-400/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-sm text-gray-300">Analyze</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-400/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-sm text-gray-300">Protect</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="text-sm text-gray-300">Recover</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start with our free plan and experience how AI can protect your property.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup?plan=free"
              className="inline-flex items-center gap-2 bg-green-400 text-black px-8 py-4 rounded-lg font-semibold hover:bg-green-300 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-green-400/30 text-green-400 px-8 py-4 rounded-lg font-semibold hover:bg-green-400/10 transition-colors"
            >
              View All Plans
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            No credit card required · 30-day money-back guarantee
          </p>
        </section>

      </div>
    </div>
  );
}