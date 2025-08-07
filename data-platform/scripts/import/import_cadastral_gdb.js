#!/usr/bin/env node

/**
 * CADASTRAL GEODATABASE IMPORT SCRIPT
 * Efficiently processes 19GB Cadastral_Statewide.gdb into staging table
 *
 * Strategy:
 * 1. Use ogr2ogr to convert GDB → CSV in chunks
 * 2. Stream CSV data directly to staging table
 * 3. Process in batches with progress monitoring
 * 4. Handle large dataset with memory optimization
 */

const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");
const { createClient } = require("@supabase/supabase-js");
const { createReadStream } = require("fs");
const readline = require("readline");
const crypto = require("crypto");

// Load environment
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 2000;
const GDB_PATH =
  "/Users/madengineering/ClaimGuardian/Cadastral_Statewide.gdb 2";
const TEMP_DIR = "/tmp/cadastral_import";
const CHUNK_SIZE = 50000; // Records per CSV chunk

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Progress tracking
let totalRecordsProcessed = 0;
let totalBatchesProcessed = 0;
let startTime = Date.now();

class CadastralImporter {
  constructor() {
    this.batchId = this.generateBatchId();
    this.tempFiles = [];
  }

  generateBatchId() {
    return `cadastral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log(
      `████████╗██╗  ██╗██████╗  ██████╗ ████████╗████████╗██╗     ███████╗`,
    );
    console.log(
      `╚══██╔══╝██║  ██║██╔══██╗██╔═══██╗╚══██╔══╝╚══██╔══╝██║     ██╔════╝`,
    );
    console.log(
      `   ██║   ███████║██████╔╝██║   ██║   ██║      ██║   ██║     █████╗  `,
    );
    console.log(
      `   ██║   ██╔══██║██╔══██╗██║   ██║   ██║      ██║   ██║     ██╔══╝  `,
    );
    console.log(
      `   ██║   ██║  ██║██║  ██║╚██████╔╝   ██║      ██║   ███████╗███████╗`,
    );
    console.log(
      `   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝      ╚═╝   ╚══════╝╚══════╝`,
    );
    console.log(
      `${colors.reset}${colors.bright}    CADASTRAL GEODATABASE IMPORT - 19GB DATASET${colors.reset}`,
    );
    console.log("");

    // Create temp directory
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Verify geodatabase exists
    if (!fs.existsSync(GDB_PATH)) {
      throw new Error(`Geodatabase not found: ${GDB_PATH}`);
    }

    // Check staging table exists
    const { error } = await supabase
      .from("stg_cadastral_parcels")
      .select("stg_load_id")
      .limit(1);
    if (error) {
      throw new Error(`Staging table not ready: ${error.message}`);
    }

    console.log(`${colors.green}✅ Initialization complete${colors.reset}`);
    console.log(`   📁 Geodatabase: ${GDB_PATH}`);
    console.log(`   🆔 Batch ID: ${this.batchId}`);
    console.log(`   📊 Batch size: ${BATCH_SIZE} records`);
    console.log(`   📦 Chunk size: ${CHUNK_SIZE} records`);
    console.log("");
  }

  async discoverLayers() {
    console.log(
      `${colors.cyan}🔍 Discovering geodatabase layers...${colors.reset}`,
    );

    return new Promise((resolve, reject) => {
      exec(`ogrinfo -q "${GDB_PATH}"`, (error, stdout, stderr) => {
        if (error) {
          console.log(
            `${colors.yellow}⚠️  Standard ogrinfo failed, trying alternative approach...${colors.reset}`,
          );
          // Fallback: assume standard layer names
          resolve([
            "Florida_Parcels",
            "Cadastral_Parcels",
            "parcels",
            "Parcels",
          ]);
          return;
        }

        const layers = stdout
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => line.replace(/^\d+:\s*/, "").trim());

        console.log(`   📋 Found ${layers.length} layers`);
        layers.forEach((layer, i) => {
          console.log(`      ${i + 1}. ${layer}`);
        });

        resolve(layers);
      });
    });
  }

  async getLayerInfo(layerName) {
    console.log(
      `${colors.cyan}📊 Analyzing layer: ${layerName}${colors.reset}`,
    );

    return new Promise((resolve, reject) => {
      exec(
        `ogrinfo -so "${GDB_PATH}" "${layerName}"`,
        (error, stdout, stderr) => {
          if (error) {
            resolve(null); // Layer doesn't exist or can't be read
            return;
          }

          const lines = stdout.split("\n");
          let featureCount = 0;
          const fields = [];

          lines.forEach((line) => {
            if (line.includes("Feature Count:")) {
              featureCount = parseInt(line.split(":")[1].trim()) || 0;
            } else if (
              line.includes(":") &&
              !line.includes("Layer name") &&
              !line.includes("Geometry")
            ) {
              const fieldMatch = line.match(/(\w+):\s*(\w+)/);
              if (fieldMatch) {
                fields.push({ name: fieldMatch[1], type: fieldMatch[2] });
              }
            }
          });

          resolve({
            name: layerName,
            featureCount,
            fields,
            isValid: featureCount > 0,
          });
        },
      );
    });
  }

  async exportToCSV(layerName, outputPath, offset = 0, limit = null) {
    console.log(`   📤 Exporting ${layerName} to CSV...`);

    let sql = `SELECT * FROM "${layerName}"`;
    if (limit) {
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    return new Promise((resolve, reject) => {
      const args = [
        "-f",
        "CSV",
        "-sql",
        sql,
        "-lco",
        "GEOMETRY=AS_WKT",
        outputPath,
        GDB_PATH,
      ];

      const ogr2ogr = spawn("ogr2ogr", args);

      ogr2ogr.on("close", (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`ogr2ogr failed with code ${code}`));
        }
      });

      ogr2ogr.on("error", (error) => {
        reject(error);
      });
    });
  }

  generateRecordHash(record) {
    const recordString = JSON.stringify(record, Object.keys(record).sort());
    return crypto.createHash("md5").update(recordString).digest("hex");
  }

  async processCSVFile(csvPath) {
    console.log(`   🔄 Processing CSV: ${path.basename(csvPath)}`);

    const fileStream = createReadStream(csvPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let headers = null;
    let batch = [];
    let recordCount = 0;

    for await (const line of rl) {
      if (!headers) {
        headers = this.parseCSVLine(line);
        continue;
      }

      const values = this.parseCSVLine(line);
      if (values.length !== headers.length) continue;

      // Create record object
      const record = {};
      headers.forEach((header, idx) => {
        let value = values[idx] || "";
        value = value.replace(/^"|"$/g, "").trim();
        record[header] = value === "" ? null : value;
      });

      // Map to staging table structure
      const stagingRecord = this.mapToStagingStructure(record);
      stagingRecord.stg_batch_id = this.batchId;
      stagingRecord.stg_record_hash = this.generateRecordHash(record);

      batch.push(stagingRecord);
      recordCount++;

      // Process batch when full
      if (batch.length >= BATCH_SIZE) {
        await this.insertBatch(batch);
        batch = [];
        totalBatchesProcessed++;
        this.showProgress(recordCount);
      }
    }

    // Process remaining records
    if (batch.length > 0) {
      await this.insertBatch(batch);
      totalBatchesProcessed++;
    }

    totalRecordsProcessed += recordCount;
    return recordCount;
  }

  mapToStagingStructure(record) {
    const mapped = {};

    // Map known fields to staging structure
    const fieldMapping = {
      OBJECTID: "objectid",
      PARCEL_ID: "parcel_id",
      PARCEL_NUMBER: "parcel_number",
      PIN: "pin",
      APN: "apn",
      ACCOUNT_NUMBER: "account_number",
      COUNTY_CODE: "county_code",
      COUNTY_NAME: "county_name",
      COUNTY_FIPS: "county_fips",
      OWNER_NAME: "owner_name",
      SITE_ADDRESS: "site_address_1",
      LATITUDE: "latitude",
      LONGITUDE: "longitude",
      WKT: "geometry_wkt",
    };

    // Map known fields
    Object.entries(record).forEach(([key, value]) => {
      const stagingField = fieldMapping[key.toUpperCase()];
      if (stagingField) {
        mapped[stagingField] = value;
      }
    });

    // Map unmapped fields to flexible columns
    let dataFieldIndex = 1;
    let gdbFieldIndex = 1;

    Object.entries(record).forEach(([key, value]) => {
      if (!fieldMapping[key.toUpperCase()]) {
        if (dataFieldIndex <= 20) {
          mapped[`data_field_${String(dataFieldIndex).padStart(2, "0")}`] =
            `${key}:${value}`;
          dataFieldIndex++;
        } else if (gdbFieldIndex <= 25) {
          mapped[`gdb_field_${String(gdbFieldIndex).padStart(2, "0")}`] =
            `${key}:${value}`;
          gdbFieldIndex++;
        }
      }
    });

    return mapped;
  }

  async insertBatch(batch) {
    const { error } = await supabase
      .from("stg_cadastral_parcels")
      .insert(batch);

    if (error) {
      throw new Error(`Batch insert failed: ${error.message}`);
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  showProgress(currentFileRecords) {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = Math.round(totalRecordsProcessed / elapsed);

    process.stdout.write(
      `\r   📊 Progress: ${totalRecordsProcessed.toLocaleString()} records | ${totalBatchesProcessed} batches | ${rate} rec/s`,
    );
  }

  async cleanup() {
    console.log(
      `\n${colors.yellow}🧹 Cleaning up temporary files...${colors.reset}`,
    );

    for (const file of this.tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  }

  async run() {
    try {
      await this.initialize();

      // Discover and analyze layers
      const layers = await this.discoverLayers();
      let mainLayer = null;

      for (const layerName of layers) {
        const layerInfo = await this.getLayerInfo(layerName);
        if (layerInfo && layerInfo.isValid) {
          mainLayer = layerInfo;
          break;
        }
      }

      if (!mainLayer) {
        throw new Error("No valid layers found in geodatabase");
      }

      console.log(
        `${colors.green}🎯 Processing main layer: ${mainLayer.name}${colors.reset}`,
      );
      console.log(
        `   📊 Estimated records: ${mainLayer.featureCount.toLocaleString()}`,
      );
      console.log(`   🏷️  Fields: ${mainLayer.fields.length}`);
      console.log("");

      // Process in chunks to handle large dataset
      const totalRecords = mainLayer.featureCount;
      const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

      console.log(
        `${colors.cyan}🚀 Starting chunked processing...${colors.reset}`,
      );
      console.log(`   📦 Total chunks: ${totalChunks}`);
      console.log(`   🔢 Records per chunk: ${CHUNK_SIZE.toLocaleString()}`);
      console.log("");

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const offset = chunkIndex * CHUNK_SIZE;
        const chunkNum = chunkIndex + 1;

        console.log(
          `${colors.bright}📦 Processing chunk ${chunkNum}/${totalChunks}${colors.reset}`,
        );

        // Export chunk to CSV
        const csvPath = path.join(TEMP_DIR, `chunk_${chunkIndex}.csv`);
        this.tempFiles.push(csvPath);

        await this.exportToCSV(mainLayer.name, csvPath, offset, CHUNK_SIZE);

        // Process CSV file
        const recordsProcessed = await this.processCSVFile(csvPath);

        console.log("");
        console.log(
          `   ${colors.green}✅ Chunk ${chunkNum} complete: ${recordsProcessed.toLocaleString()} records${colors.reset}`,
        );

        // Clean up chunk file immediately to save space
        fs.unlinkSync(csvPath);
      }

      // Final statistics
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      const avgRate = Math.round(totalRecordsProcessed / totalTime);

      console.log("");
      console.log(
        `${colors.bright}${colors.green}🎉 IMPORT COMPLETE!${colors.reset}`,
      );
      console.log("═".repeat(80));
      console.log(
        `   📊 Total records processed: ${colors.green}${totalRecordsProcessed.toLocaleString()}${colors.reset}`,
      );
      console.log(
        `   ⏱️  Total time: ${colors.blue}${Math.floor(totalTime / 60)}m ${Math.floor(totalTime % 60)}s${colors.reset}`,
      );
      console.log(
        `   ⚡ Average rate: ${colors.cyan}${avgRate} records/second${colors.reset}`,
      );
      console.log(
        `   🆔 Batch ID: ${colors.yellow}${this.batchId}${colors.reset}`,
      );
      console.log("");

      // Get final staging statistics
      const { data: stats } = await supabase.rpc("get_cadastral_staging_stats");
      if (stats && stats.length > 0) {
        const stat = stats[0];
        console.log(
          `${colors.bright}📈 STAGING TABLE STATISTICS${colors.reset}`,
        );
        console.log(
          `   Total records: ${stat.total_records?.toLocaleString() || "0"}`,
        );
        console.log(
          `   Unique parcels: ${stat.unique_parcels?.toLocaleString() || "0"}`,
        );
        console.log(`   Unique counties: ${stat.unique_counties || "0"}`);
        console.log(
          `   Table size: ${stat.size_estimate_mb?.toFixed(1) || "0"} MB`,
        );
      }
    } catch (error) {
      console.error(
        `${colors.red}❌ Import failed: ${error.message}${colors.reset}`,
      );
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the importer
if (require.main === module) {
  const importer = new CadastralImporter();
  importer.run().catch((error) => {
    console.error("Import failed:", error.message);
    process.exit(1);
  });
}

module.exports = CadastralImporter;
