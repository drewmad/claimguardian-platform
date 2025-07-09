# ClaimGuardian MCP Server

Custom Model Context Protocol (MCP) server for ClaimGuardian property insurance claim management.

## Available Tools

### Property Management
- `search_properties` - Search properties in the database
- `get_property_details` - Get detailed property information
- `create_property` - Create a new property

### Claim Management
- `create_claim` - Create a new insurance claim
- `update_claim_status` - Update claim status
- `search_claims` - Search claims with filters
- `generate_claim_package` - Generate complete claim documentation

### Damage Assessment
- `create_damage_assessment` - Create damage assessment
- `add_assessment_photos` - Add photos to assessment
- `add_repair_estimate` - Add contractor estimates
- `analyze_damage_patterns` - Florida-specific damage analysis

## Setup

1. Build the server:
   ```bash
   pnpm --filter @claimguardian/mcp-server build
   ```

2. The server is configured in `.claude/settings.local.json`

3. Start using the tools in Claude with the `mcp_claimguardian_` prefix

## Development

Run in development mode:
```bash
pnpm --filter @claimguardian/mcp-server dev
```

## Usage Examples

```typescript
// Search for properties
mcp_claimguardian_search_properties({ query: "Miami", limit: 10 })

// Create a claim
mcp_claimguardian_create_claim({
  propertyId: "prop-123",
  type: "hurricane",
  date_of_loss: "2024-08-15",
  description: "Hurricane damage to roof and windows"
})

// Analyze damage patterns
mcp_claimguardian_analyze_damage_patterns({
  propertyId: "prop-123",
  timeframe: "1y"
})
```