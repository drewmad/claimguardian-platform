// Test connectivity to county ArcGIS servers
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const endpoints = [
  {
    name: "Charlotte County",
    url: "https://ccgis.charlottecountyfl.gov/arcgis/rest/services/WEB_Parcels/MapServer/0?f=json",
  },
  {
    name: "Lee County",
    url: "https://maps.leepa.org/arcgis/rest/services/Leegis/SecureParcels/MapServer/0?f=json",
  },
  {
    name: "Sarasota County",
    url: "https://gis.sc-pa.com/server/rest/services/Parcel/ParcelData/MapServer/1?f=json",
  },
];

Deno.serve(async (req) => {
  const results = [];

  for (const endpoint of endpoints) {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Testing ${endpoint.name}...`,
      }),
    );

    try {
      const response = await fetch(endpoint.url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; ClaimGuardian/1.0)",
        },
      });

      const data = await response.json();

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        success: response.ok,
        serviceInfo: data.currentVersion
          ? {
              version: data.currentVersion,
              serviceName: data.serviceDescription || data.name,
              layers: data.layers?.length || 0,
            }
          : null,
        error: null,
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 0,
        success: false,
        serviceInfo: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return new Response(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    },
  );
});
