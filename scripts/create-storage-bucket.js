#!/usr/bin/env node

// Create Supabase Storage Bucket
const https = require("https");

// Get service key from keychain
const { execSync } = require("child_process");
let serviceKey;

try {
  serviceKey = execSync(
    'security find-generic-password -s "ClaimGuardian-Supabase" -a "service-role-key" -w',
    {
      encoding: "utf8",
    },
  ).trim();
} catch (e) {
  console.error("Failed to get service key from keychain");
  process.exit(1);
}

const projectId = "tmlrvecuwgppbaynesji";
const bucketName = "parcels";

const data = JSON.stringify({
  id: bucketName,
  name: bucketName,
  public: false,
  fileSizeLimit: 5368709120, // 5GB
  allowedMimeTypes: ["application/json", "application/geo+json"],
});

const options = {
  hostname: `${projectId}.supabase.co`,
  port: 443,
  path: "/storage/v1/bucket",
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", responseData);

    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log("✅ Bucket created successfully!");
    } else if (
      res.statusCode === 400 &&
      responseData.includes("already exists")
    ) {
      console.log("✅ Bucket already exists");
    } else {
      console.error("❌ Failed to create bucket");
    }
  });
});

req.on("error", (error) => {
  console.error("Request error:", error);
});

req.write(data);
req.end();
