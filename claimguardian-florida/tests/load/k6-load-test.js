import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const failureRate = new Rate('failures');
const apiLatency = new Trend('api_latency', true);
const tileLatency = new Trend('tile_latency', true);

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    failures: ['rate<0.05'],           // Custom failure rate below 5%
  },
};

// Test data
const TEST_COUNTIES = ['12015', '12115', '12086']; // Charlotte, Sarasota, Miami-Dade
const SAMPLE_PARCEL_IDS = [
  '12015-001234',
  '12015-005678', 
  '12115-009876',
  '12086-054321'
];

const API_BASE = __ENV.API_BASE_URL || 'http://localhost:3000/api';
const EDGE_BASE = __ENV.EDGE_BASE_URL || 'http://localhost:54321/functions/v1';

export default function () {
  // Test mix: 60% parcel lookups, 30% tiles, 10% risk scoring
  const testType = Math.random();
  
  if (testType < 0.6) {
    testParcelLookup();
  } else if (testType < 0.9) {
    testTileGeneration();
  } else {
    testRiskScoring();
  }
  
  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
}

function testParcelLookup() {
  // Test parcel detail API
  const parcelId = SAMPLE_PARCEL_IDS[Math.floor(Math.random() * SAMPLE_PARCEL_IDS.length)];
  
  const response = http.get(`${API_BASE}/parcels/${parcelId}`, {
    timeout: '10s',
    tags: { test_type: 'parcel_lookup' },
  });
  
  const success = check(response, {
    'parcel lookup status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'parcel lookup response time < 1000ms': (r) => r.timings.duration < 1000,
    'parcel lookup has valid JSON': (r) => {
      if (r.status === 200) {
        try {
          const data = JSON.parse(r.body);
          return data.parcel_id !== undefined;
        } catch (e) {
          return false;
        }
      }
      return true; // 404 is acceptable
    },
  });
  
  failureRate.add(!success);
  apiLatency.add(response.timings.duration);
  
  // Test address lookup
  if (Math.random() < 0.3) { // 30% of parcel tests also do address lookup
    const lookupResponse = http.post(`${API_BASE}/parcels/lookup`, 
      JSON.stringify({
        address: "123 Main St Port Charlotte FL"
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '15s',
        tags: { test_type: 'address_lookup' },
      }
    );
    
    check(lookupResponse, {
      'address lookup status is 200': (r) => r.status === 200,
      'address lookup response time < 2000ms': (r) => r.timings.duration < 2000,
      'address lookup returns array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch (e) {
          return false;
        }
      },
    });
  }
}

function testTileGeneration() {
  // Test MVT tile generation at various zoom levels
  const zoom = Math.floor(Math.random() * 8) + 8; // Zoom 8-15
  const x = Math.floor(Math.random() * Math.pow(2, zoom));
  const y = Math.floor(Math.random() * Math.pow(2, zoom));
  
  const response = http.get(`${API_BASE}/tiles/parcels/${zoom}/${x}/${y}.mvt`, {
    timeout: '30s',
    tags: { test_type: 'tile_generation' },
  });
  
  const success = check(response, {
    'tile status is 200 or 204': (r) => r.status === 200 || r.status === 204,
    'tile response time < 3000ms': (r) => r.timings.duration < 3000,
    'tile has correct content type': (r) => 
      r.headers['Content-Type'] === 'application/vnd.mapbox-vector-tile' || 
      r.status === 204,
  });
  
  failureRate.add(!success);
  tileLatency.add(response.timings.duration);
}

function testRiskScoring() {
  // Test Edge Function for risk scoring
  const parcelId = SAMPLE_PARCEL_IDS[Math.floor(Math.random() * SAMPLE_PARCEL_IDS.length)];
  
  const response = http.get(`${EDGE_BASE}/parcel-risk?parcel_id=${parcelId}`, {
    timeout: '10s',
    tags: { test_type: 'risk_scoring' },
  });
  
  const success = check(response, {
    'risk scoring status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'risk scoring response time < 2000ms': (r) => r.timings.duration < 2000,
    'risk scoring has valid response': (r) => {
      if (r.status === 200) {
        try {
          const data = JSON.parse(r.body);
          return data.risk_score !== undefined && 
                 data.risk_score >= 0 && 
                 data.risk_score <= 1;
        } catch (e) {
          return false;
        }
      }
      return true; // 404 is acceptable
    },
  });
  
  failureRate.add(!success);
  apiLatency.add(response.timings.duration);
}

// Setup function - runs once per VU at start
export function setup() {
  console.log('🚀 Starting ClaimGuardian Florida API load test');
  console.log(`   API Base: ${API_BASE}`);
  console.log(`   Edge Base: ${EDGE_BASE}`);
  
  // Warm up the system
  http.get(`${API_BASE}/parcels/12015-001234`, { timeout: '30s' });
  http.get(`${API_BASE}/tiles/parcels/10/171/396.mvt`, { timeout: '30s' });
  
  console.log('✅ Warmup complete, starting load test...');
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  console.log('🏁 Load test complete');
}

// Handle different test scenarios
export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
  
  // Save detailed results to file if running in CI
  if (__ENV.CI) {
    summary['load-test-results.json'] = JSON.stringify(data);
  }
  
  return summary;
}