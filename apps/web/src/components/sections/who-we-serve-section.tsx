import { Card } from '@claimguardian/ui'
import { Home, Building, Users } from 'lucide-react'

const serviceCards = [
  {
    icon: Home,
    title: 'For Florida Property Owners',
    description: 'We help primary residents, condo owners, and vacation homeowners cut through insurer red tape after storms, leaks, or floods.'
  },
  {
    icon: Building,
    title: 'For Small Business & Rental Owners',
    description: 'Built for retail shops, restaurants, and landlords whose cash flow depends on quick, fair settlements to reopen faster.'
  },
  {
    icon: Users,
    title: 'For Community Associations',
    description: 'Ideal for HOAs and COAs that need to protect reserve funds and avoid costly special assessments after storm-related damages.'
  }
]

export function WhoWeServeSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-white section-title-underline inline-block">
            Your Advocate in Any Property Claim
          </h3>
          <p className="mt-8 text-lg text-slate-300">
            Insurance carriers have armies of experts. ClaimGuardian levels the playing field for property owners across Florida.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {serviceCards.map((card, index) => (
            <Card 
              key={index} 
              className="card-bg rounded-xl p-8 transform hover:-translate-y-2 transition-transform duration-300"
            >
              <card.icon className="w-12 h-12 mx-auto text-blue-400" />
              <h4 className="mt-5 text-xl font-semibold text-white">
                {card.title}
              </h4>
              <p className="mt-2 text-slate-400">
                {card.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}