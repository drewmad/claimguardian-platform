/**
 * @fileMetadata
 * @purpose "Lead capture form for hurricane prep PDF download"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["HurricanePrepForm"]
 * @complexity medium
 * @tags ["lead-magnet", "forms", "conversion"]
 * @status stable
 */
"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle, Mail, User } from "lucide-react";
import Link from "next/link";

export function HurricanePrepForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [propertyCount, setPropertyCount] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Simulate API call - replace with actual lead capture API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Track conversion
      if (typeof window !== "undefined") {
        console.log("[analytics] hurricane_prep_download", {
          email,
          name,
          propertyCount,
          source: "hurricane_prep_page"
        });
      }

      setIsSuccess(true);
      
      // Trigger PDF download (replace with actual PDF URL)
      const link = document.createElement('a');
      link.href = '/pdfs/hurricane-prep-2025-guide.pdf'; // You'll need to create this
      link.download = 'ClaimGuardian-Hurricane-Prep-2025.pdf';
      link.click();
      
    } catch (err) {
      setError("Failed to send guide. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-900/20 border border-green-400/30 rounded-xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Guide Downloaded Successfully!
        </h3>
        <p className="text-gray-300 mb-6">
          Check your email for additional hurricane prep resources and updates.
        </p>
        <div className="space-y-3">
          <Link
            href="/auth/signup?utm_source=hurricane_prep&utm_medium=lead_magnet"
            className="inline-flex items-center gap-2 bg-green-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-300 transition-colors"
          >
            Create My Digital Twin
          </Link>
          <p className="text-sm text-gray-400">
            Next step: Document your property with ClaimGuardian's AI tools
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8">
      <div className="text-center mb-6">
        <Download className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-white mb-2">
          Get Your Free Hurricane Prep Guide
        </h3>
        <p className="text-gray-300">
          Complete 47-page PDF with room-by-room checklists, documentation tips, 
          and post-storm claim strategies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="propertyCount" className="block text-sm font-medium text-gray-300 mb-2">
            How many properties do you own/manage in Florida?
          </label>
          <select
            id="propertyCount"
            value={propertyCount}
            onChange={(e) => setPropertyCount(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
          >
            <option value="1">1 property</option>
            <option value="2-3">2-3 properties</option>
            <option value="4-10">4-10 properties</option>
            <option value="10+">More than 10 properties</option>
          </select>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-400/30 rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-400 text-black py-4 px-6 rounded-lg font-semibold hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Preparing Your Guide...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download Free Guide
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          We respect your privacy. No spam, ever. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}