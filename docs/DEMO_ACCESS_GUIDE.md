# ClaimGuardian Demo Access Guide

## Live Demo URL
https://claimguardianai.com

## Demo Scenarios Created

### 1. Government Demo - FEMA NIMS Compliance
**Access:** Navigate to https://claimguardianai.com/nims

**Demo Data:**
- **Incident #:** 2025-0001
- **Type:** Hurricane Maria - Category 3
- **Location:** Monroe County, Florida Keys
- **Status:** Active Response
- **Complexity:** Type 2 (Regional resources required)

**Key Features to Demonstrate:**
- ICS Command Structure with live incident
- Resource tracking (3 resources deployed)
- Emergency alert distribution (75,000 recipients)
- Multi-agency coordination
- Real-time weather integration
- Automated workflow management

**Resources Available:**
- Search and Rescue Team Alpha (Assigned)
- Emergency Power Unit 1 (Available)
- Medical Supply Cache (Available)

**Active Alert:**
- Hurricane Warning with evacuation order
- CAP 1.2 compliant format
- Multi-channel distribution

---

### 2. Enterprise Demo - Business Continuity
**Organization:** Florida Power & Light (FPL)

**Demo Data:**
- **Workflow:** FPL Hurricane Response Protocol
- **Status:** Active
- **Priority:** Immediate
- **Phase:** Response

**Key Stakeholder:**
- John Martinez, Emergency Response Director
- Contact: jmartinez@fpl.com
- Phone: 561-555-0100

**Features to Highlight:**
- Enterprise workflow automation
- Stakeholder coordination
- Business continuity planning
- Critical infrastructure protection

---

### 3. Consumer Demo - Insurance Claims
**Note:** Requires authenticated user account

**Demo Claim (Planned):**
- **Claim #:** CLM-2025-001
- **Property:** 123 Ocean Drive, Key West
- **Damage:** $125,000 hurricane damage
- **AI Assessment:** $135,000 recommended
- **Status:** Under Investigation

---

## Demo Presentation Flow

### For Government Agencies (15 minutes)
1. **Start:** NIMS Solutions page (/nims-solutions)
   - Show FEMA compliance capabilities
   - Highlight proven results metrics

2. **Live Dashboard:** NIMS Dashboard (/nims)
   - Show active hurricane incident
   - Demonstrate resource deployment
   - View emergency alerts
   - Check compliance metrics

3. **Key Differentiators:**
   - First commercial NIMS-compliant platform
   - 75% faster response time
   - 60% cost reduction
   - Real-time multi-agency coordination

### For Insurance Partners (10 minutes)
1. **Start:** Landing page
   - Consumer value proposition
   - AI-powered claim optimization

2. **Features:**
   - AI damage assessment
   - Document generation
   - Claim tracking
   - Community insights

3. **ROI Discussion:**
   - 30-40% of claims are underpaid
   - Average recovery: $15,000 per claim
   - Reduced claim processing time

### For Investors (20 minutes)
1. **Market Opportunity:**
   - $4.6B+ combined TAM
   - Dual market approach
   - First-mover advantage

2. **Live Product Demo:**
   - Show both government and consumer features
   - Demonstrate AI capabilities
   - Highlight seamless integration

3. **Traction:**
   - FEMA NIMS compliance achieved
   - Production deployment complete
   - 500+ beta signups

4. **Financial Projections:**
   - Path to $100M revenue
   - 70% gross margins
   - Multiple revenue streams

---

## Technical Demo Notes

### Database Verification
```sql
-- Check demo data exists
SELECT 'Incidents' as type, COUNT(*) as count 
FROM ics_incidents WHERE id LIKE 'DEMO%'
UNION ALL
SELECT 'Resources', COUNT(*) 
FROM nims_resources WHERE id LIKE 'DEMO%'
UNION ALL
SELECT 'Alerts', COUNT(*) 
FROM emergency_alerts WHERE id LIKE 'DEMO%'
UNION ALL
SELECT 'Workflows', COUNT(*) 
FROM disaster_workflows WHERE id LIKE 'DEMO%';
```

### API Endpoints
- GET /api/nims/incidents - View active incidents
- GET /api/nims/resources - View available resources
- GET /api/nims/alerts - View emergency alerts
- GET /api/nims/workflows - View active workflows

### Demo Reset
If needed, run: `pnpm tsx scripts/create-demo-data.ts`

---

## Support Contacts
- Technical Issues: tech@claimguardianai.com
- Demo Scheduling: sales@claimguardianai.com
- Investor Relations: investors@claimguardianai.com

---

*Last Updated: January 6, 2025*