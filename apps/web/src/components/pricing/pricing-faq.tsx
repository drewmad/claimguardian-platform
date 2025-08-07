/**
 * @fileMetadata
 * @purpose "Pricing FAQ accordion component"
 * @dependencies []
 * @owner billing-team
 * @status stable
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged a prorated amount for the remainder of your billing cycle. When you downgrade, the change will take effect at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. All payments are processed securely through Stripe.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! The Homeowner plan includes a 14-day free trial. No credit card is required to start your trial. You can cancel anytime during the trial period without being charged.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "Your data remains available for 30 days after cancellation. During this time, you can reactivate your account or export your data. After 30 days, data may be permanently deleted according to our data retention policy.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer:
      "Yes! When you choose annual billing, you save approximately 17% compared to monthly billing. This is equivalent to getting 2 months free each year.",
  },
  {
    question: 'What\'s included in "unlimited" features?',
    answer:
      "Unlimited means there are no hard limits on usage for that feature. However, all usage is subject to our Fair Use Policy to prevent abuse and ensure quality service for all customers.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer a 30-day money-back guarantee for annual plans. For monthly plans, you can cancel anytime and won't be charged for the next billing cycle. Partial month refunds are not available.",
  },
  {
    question: "Do you offer custom enterprise plans?",
    answer:
      "Yes! Our Enterprise plan can be customized to meet your specific needs. Contact our sales team to discuss custom features, pricing, SLAs, and dedicated support options.",
  },
];

export function PricingFAQ() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-gray-600">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
