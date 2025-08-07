#!/usr/bin/env node

import { glob } from "glob";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const directoriesToScan = ["apps", "packages"];
const fileExtensions = [".js", ".jsx", ".ts", ".tsx"];
const ignorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
];

async function generateReport() {
  console.log("📊 Generating metadata coverage report...\n");

  const filesToScan = await glob(
    `{${directoriesToScan.join(",")}}/**/*.{js,jsx,ts,tsx}`,
    {
      ignore: ignorePatterns,
    },
  );

  const stats = {
    totalFiles: 0,
    filesWithMetadata: 0,
    filesByDirectory: {},
    filesByOwner: {},
    filesByStatus: {},
    filesByAiIntegration: {},
    filesByInsuranceContext: {},
    tagUsage: {},
  };

  const detailedReport = [];

  for (const file of filesToScan) {
    if (!fileExtensions.includes(path.extname(file))) {
      continue;
    }

    stats.totalFiles++;

    const content = await readFile(file, "utf-8");
    const directory = path.dirname(file);

    // Initialize directory stats
    if (!stats.filesByDirectory[directory]) {
      stats.filesByDirectory[directory] = {
        total: 0,
        withMetadata: 0,
        coverage: 0,
      };
    }
    stats.filesByDirectory[directory].total++;

    if (content.includes("@fileMetadata")) {
      stats.filesWithMetadata++;
      stats.filesByDirectory[directory].withMetadata++;

      // Extract metadata details
      const metadataMatch = content.match(
        /\/\*\*[\s\S]*?@fileMetadata[\s\S]*?\*\//,
      );
      if (metadataMatch) {
        const metadata = metadataMatch[0];

        // Extract tag values
        const extractTag = (tag) => {
          const match = metadata.match(
            new RegExp(`${tag.replace("@", "\\@")}\\s+(.+)`),
          );
          return match ? match[1].trim().replace(/['"]/g, "") : "unknown";
        };

        const owner = extractTag("@owner");
        const status = extractTag("@status");
        const aiIntegration = extractTag("@ai-integration");
        const insuranceContext = extractTag("@insurance-context");

        // Count by categories
        stats.filesByOwner[owner] = (stats.filesByOwner[owner] || 0) + 1;
        stats.filesByStatus[status] = (stats.filesByStatus[status] || 0) + 1;
        stats.filesByAiIntegration[aiIntegration] =
          (stats.filesByAiIntegration[aiIntegration] || 0) + 1;
        stats.filesByInsuranceContext[insuranceContext] =
          (stats.filesByInsuranceContext[insuranceContext] || 0) + 1;

        // Count tag usage
        const tags = metadata.match(/@\w+/g) || [];
        for (const tag of tags) {
          if (tag !== "@fileMetadata") {
            stats.tagUsage[tag] = (stats.tagUsage[tag] || 0) + 1;
          }
        }

        detailedReport.push({
          file,
          owner,
          status,
          aiIntegration,
          insuranceContext,
          purpose: extractTag("@purpose"),
        });
      }
    }
  }

  // Calculate coverage percentages
  for (const dir of Object.keys(stats.filesByDirectory)) {
    const dirStats = stats.filesByDirectory[dir];
    dirStats.coverage = Math.round(
      (dirStats.withMetadata / dirStats.total) * 100,
    );
  }

  const overallCoverage = Math.round(
    (stats.filesWithMetadata / stats.totalFiles) * 100,
  );

  // Generate console report
  console.log("📈 METADATA COVERAGE REPORT");
  console.log("=".repeat(50));
  console.log(`📁 Total Files Scanned: ${stats.totalFiles}`);
  console.log(`✅ Files with Metadata: ${stats.filesWithMetadata}`);
  console.log(`📊 Overall Coverage: ${overallCoverage}%`);
  console.log("");

  // Directory breakdown
  console.log("📂 COVERAGE BY DIRECTORY:");
  console.log("-".repeat(50));
  const sortedDirs = Object.entries(stats.filesByDirectory).sort(
    ([, a], [, b]) => b.coverage - a.coverage,
  );

  for (const [dir, dirStats] of sortedDirs) {
    const coverageBar =
      "█".repeat(Math.floor(dirStats.coverage / 5)) +
      "░".repeat(20 - Math.floor(dirStats.coverage / 5));
    console.log(`${dir}`);
    console.log(
      `  ${coverageBar} ${dirStats.coverage}% (${dirStats.withMetadata}/${dirStats.total})`,
    );
  }
  console.log("");

  // Top categories
  console.log("👥 FILES BY OWNER:");
  console.log("-".repeat(30));
  Object.entries(stats.filesByOwner)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([owner, count]) => {
      console.log(`  ${owner}: ${count} files`);
    });
  console.log("");

  console.log("🏷️  FILES BY STATUS:");
  console.log("-".repeat(30));
  Object.entries(stats.filesByStatus)
    .sort(([, a], [, b]) => b - a)
    .forEach(([status, count]) => {
      console.log(`  ${status}: ${count} files`);
    });
  console.log("");

  console.log("🤖 AI INTEGRATION USAGE:");
  console.log("-".repeat(30));
  Object.entries(stats.filesByAiIntegration)
    .sort(([, a], [, b]) => b - a)
    .forEach(([integration, count]) => {
      console.log(`  ${integration}: ${count} files`);
    });
  console.log("");

  console.log("🔧 MOST USED TAGS:");
  console.log("-".repeat(30));
  Object.entries(stats.tagUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count} times`);
    });
  console.log("");

  // Generate detailed JSON report
  const reportData = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: stats.totalFiles,
      filesWithMetadata: stats.filesWithMetadata,
      overallCoverage,
      coverageByDirectory: stats.filesByDirectory,
    },
    statistics: {
      filesByOwner: stats.filesByOwner,
      filesByStatus: stats.filesByStatus,
      filesByAiIntegration: stats.filesByAiIntegration,
      filesByInsuranceContext: stats.filesByInsuranceContext,
      tagUsage: stats.tagUsage,
    },
    files: detailedReport,
  };

  // Write JSON report
  const reportPath = "metadata-coverage-report.json";
  await writeFile(reportPath, JSON.stringify(reportData, null, 2));

  console.log(`💾 Detailed report saved to: ${reportPath}`);
  console.log("");

  // Recommendations
  console.log("💡 RECOMMENDATIONS:");
  console.log("-".repeat(30));

  if (overallCoverage < 50) {
    console.log(
      "❗ Low coverage detected. Run `pnpm metadata:generate` to add headers",
    );
  } else if (overallCoverage < 80) {
    console.log("⚠️  Good progress! Focus on directories with low coverage");
  } else {
    console.log(
      "🎉 Excellent coverage! Run `pnpm metadata:validate` to check quality",
    );
  }

  const unknownOwners = stats.filesByOwner["unknown"] || 0;
  if (unknownOwners > 0) {
    console.log(
      `📝 ${unknownOwners} files have unknown owners - consider assigning teams`,
    );
  }

  const experimentalFiles = stats.filesByStatus["experimental"] || 0;
  if (experimentalFiles > stats.filesWithMetadata * 0.2) {
    console.log(
      `🧪 ${experimentalFiles} experimental files - consider stabilizing mature code`,
    );
  }

  process.exit(0);
}

generateReport().catch((err) => {
  console.error("❌ Report generation failed:", err);
  process.exit(1);
});
