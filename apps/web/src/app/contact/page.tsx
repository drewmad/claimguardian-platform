/**
 * @fileMetadata
 * @purpose "Renders the contact page with support information and team details."
 * @dependencies ["lucide-react"]
 * @owner support-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "Contact support page with team information and support email"
 * @owner support-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["ContactPage"]
 * @complexity low
 * @tags ["contact", "support", "team"]
 * @status stable
 */

import { Mail, MapPin, Clock, Users } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Get in Touch</span>
              <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                We're Here to Help
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built by a Florida family team, we're always ready to support your
              property intelligence journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6">
                Contact Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email Support</h3>
                    <a
                      href="mailto:support@claimguardianai.com"
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      support@claimguardianai.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Location</h3>
                    <p className="text-gray-400">Florida, United States</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-400/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Response Time</h3>
                    <p className="text-gray-400">Usually within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Our Team</h3>
                    <p className="text-gray-400">
                      Family team of five with one developer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* About Our Support */}
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6">
                Our Support Philosophy
              </h2>

              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">
                    Built by those who've been there.
                  </strong>{" "}
                  We're not a faceless corporation - we're a Florida family who
                  survived Hurricane Ian and built what we needed.
                </p>

                <p>
                  <strong className="text-white">
                    Real people, real responses.
                  </strong>{" "}
                  When you email us, you're talking directly to the team
                  building ClaimGuardian, not a call center.
                </p>

                <p>
                  <strong className="text-white">Community-focused.</strong> We
                  believe in helping neighbors succeed. Your questions help us
                  build better features for everyone.
                </p>

                <div className="mt-6 p-4 bg-green-400/10 rounded-lg border border-green-400/20">
                  <h3 className="font-semibold text-green-400 mb-2">
                    We're actively building
                  </h3>
                  <p className="text-sm text-gray-400">
                    As a small family team, we're continuously improving based
                    on user feedback. Your input directly shapes our development
                    priorities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="/legal/privacy-policy"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Privacy Policy →
              </a>
              <a
                href="/legal/terms-of-service"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Terms of Service →
              </a>
              <a
                href="/guides"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Help Guides →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
