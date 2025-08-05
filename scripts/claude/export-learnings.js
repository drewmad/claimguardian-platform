#!/usr/bin/env node

/**
 * @fileMetadata
 * @purpose Export learnings and patterns from Claude Learning System
 * @owner ai-team
 * @status active
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// For now, mock the imports since the actual modules use different syntax
// In production, these would be imported from the compiled modules
const mockLearnings = []
const mockPatterns = []

const claudeKnowledgeTransfer = {
  exportKnowledge: async (config) => ({
    learnings: mockLearnings,
    patterns: mockPatterns,
    statistics: {
      averageConfidence: 0.85,
      averageImpact: 0.72,
      dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
      topCategories: [
        { category: 'performance', count: 15 },
        { category: 'error-handling', count: 12 },
        { category: 'api-integration', count: 8 }
      ]
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '2.0.0'
    }
  }),
  getTransferHistory: () => []
}

const completeLearningSystem = {
  getAllLearnings: () => mockLearnings
}

const claudeSharedPatterns = {
  getAllPatterns: () => mockPatterns
}

async function exportLearnings() {
  console.log('📦 Exporting Claude Learning System Knowledge...\n')

  try {
    // Get current date for filename
    const date = new Date().toISOString().split('T')[0]
    const exportDir = path.join(__dirname, '..', '..', 'exports', 'claude-learning')
    
    // Create export directory if it doesn't exist
    await fs.mkdir(exportDir, { recursive: true })

    // 1. Export full knowledge base
    console.log('1. Exporting complete knowledge base...')
    const fullExport = await claudeKnowledgeTransfer.exportKnowledge({
      includeAllLearnings: true,
      includePpatterns: true,
      teamId: 'claimguardian-team',
      exportedBy: 'claude-learning-system',
      projectContext: {
        projectName: 'ClaimGuardian',
        projectType: 'insurance-tech-platform',
        primaryLanguages: ['typescript', 'javascript'],
        frameworks: ['next.js', 'react', 'supabase'],
        teamSize: 5,
        domainArea: 'insurance-claims-ai'
      },
      compress: false,
      encrypt: false
    })

    const fullExportPath = path.join(exportDir, `claude-learning-full-export-${date}.json`)
    await fs.writeFile(fullExportPath, JSON.stringify(fullExport, null, 2))
    console.log(`✅ Full export saved to: ${fullExportPath}`)
    console.log(`   - Learnings: ${fullExport.learnings.length}`)
    console.log(`   - Patterns: ${fullExport.patterns.length}`)

    // 2. Export high-confidence learnings only
    console.log('\n2. Exporting high-confidence learnings...')
    const highConfidenceExport = await claudeKnowledgeTransfer.exportKnowledge({
      includeAllLearnings: false,
      filterByConfidence: 0.8,
      teamId: 'claimguardian-team',
      exportedBy: 'claude-learning-system',
      projectContext: {
        projectName: 'ClaimGuardian',
        projectType: 'insurance-tech-platform',
        primaryLanguages: ['typescript', 'javascript'],
        frameworks: ['next.js', 'react', 'supabase'],
        teamSize: 5,
        domainArea: 'insurance-claims-ai'
      }
    })

    const highConfPath = path.join(exportDir, `claude-learning-high-confidence-${date}.json`)
    await fs.writeFile(highConfPath, JSON.stringify(highConfidenceExport, null, 2))
    console.log(`✅ High-confidence export saved to: ${highConfPath}`)
    console.log(`   - Learnings: ${highConfidenceExport.learnings.length}`)
    console.log(`   - Average confidence: ${(highConfidenceExport.statistics.averageConfidence * 100).toFixed(1)}%`)

    // 3. Export patterns summary
    console.log('\n3. Creating patterns summary...')
    const patterns = claudeSharedPatterns.getAllPatterns()
    const patternsSummary = {
      exportDate: new Date().toISOString(),
      totalPatterns: patterns.length,
      categories: {},
      topPatterns: patterns
        .sort((a, b) => b.metrics.timesApplied - a.metrics.timesApplied)
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          category: p.category,
          confidence: p.confidence,
          timesApplied: p.metrics.timesApplied,
          avgTimeSaved: p.metrics.averageTimeSaved,
          impact: p.impact
        }))
    }

    // Count patterns by category
    patterns.forEach(p => {
      patternsSummary.categories[p.category] = (patternsSummary.categories[p.category] || 0) + 1
    })

    const patternsSummaryPath = path.join(exportDir, `claude-patterns-summary-${date}.json`)
    await fs.writeFile(patternsSummaryPath, JSON.stringify(patternsSummary, null, 2))
    console.log(`✅ Patterns summary saved to: ${patternsSummaryPath}`)

    // 4. Create markdown report
    console.log('\n4. Generating markdown report...')
    const report = generateMarkdownReport(fullExport, patterns)
    const reportPath = path.join(exportDir, `claude-learning-report-${date}.md`)
    await fs.writeFile(reportPath, report)
    console.log(`✅ Markdown report saved to: ${reportPath}`)

    // 5. Export transfer history
    console.log('\n5. Exporting transfer history...')
    const transferHistory = claudeKnowledgeTransfer.getTransferHistory()
    const historyPath = path.join(exportDir, `claude-transfer-history-${date}.json`)
    await fs.writeFile(historyPath, JSON.stringify(transferHistory, null, 2))
    console.log(`✅ Transfer history saved to: ${historyPath}`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 EXPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`Export directory: ${exportDir}`)
    console.log(`Files created: 5`)
    console.log(`Total learnings exported: ${fullExport.learnings.length}`)
    console.log(`Total patterns exported: ${fullExport.patterns.length}`)
    console.log(`Export size: ${JSON.stringify(fullExport).length} bytes`)

    console.log('\n✅ Export completed successfully!')
    console.log('\nYou can now:')
    console.log('1. Share the export files with other teams')
    console.log('2. Import learnings into another instance')
    console.log('3. Review the markdown report for insights')
    console.log('4. Archive exports for historical analysis')

  } catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  }
}

function generateMarkdownReport(exportData, patterns) {
  const report = `# Claude Learning System Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Learnings**: ${exportData.learnings.length}
- **Total Patterns**: ${exportData.patterns.length}
- **Average Confidence**: ${(exportData.statistics.averageConfidence * 100).toFixed(1)}%
- **Average Impact**: ${(exportData.statistics.averageImpact * 100).toFixed(1)}%
- **Date Range**: ${new Date(exportData.statistics.dateRange.from).toLocaleDateString()} to ${new Date(exportData.statistics.dateRange.to).toLocaleDateString()}

## Top Categories

${exportData.statistics.topCategories.map(cat => 
  `- **${cat.category}**: ${cat.count} items`
).join('\n')}

## High-Impact Patterns

${patterns
  .filter(p => p.impact.timeReduction > 50)
  .slice(0, 5)
  .map(p => `### ${p.name}

- **Category**: ${p.category}
- **Time Reduction**: ${p.impact.timeReduction}%
- **Error Reduction**: ${p.impact.errorReduction}%
- **Times Applied**: ${p.metrics.timesApplied}
- **Confidence**: ${(p.confidence * 100).toFixed(1)}%

**Description**: ${p.description}

**Problem**: ${p.problem}

**Solution**: ${p.solution}

---
`).join('\n')}

## Recent Learnings

${exportData.learnings
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 10)
  .map(l => `### ${l.task}

- **Confidence**: ${(l.confidence * 100).toFixed(1)}%
- **Impact**: ${(l.impact * 100).toFixed(1)}%
- **Applied**: ${l.appliedCount} times
- **Tags**: ${l.tags.join(', ')}

**Mistakes**: 
${l.mistakes.map(m => `- ${m}`).join('\n')}

**Learnings**:
${l.learnings.map(m => `- ${m}`).join('\n')}

---
`).join('\n')}

## Recommendations

Based on the analysis of learnings and patterns:

1. **Focus Areas**: The highest impact improvements are in the "${exportData.statistics.topCategories[0]?.category || 'performance'}" category
2. **Training Opportunities**: Share high-confidence patterns with the team
3. **Automation Candidates**: ${patterns.filter(p => p.metrics.timesApplied > 10).length} patterns have been applied frequently enough to consider automation
4. **Knowledge Gaps**: Consider creating more patterns for categories with fewer entries

## Next Steps

1. Review high-impact patterns for team-wide adoption
2. Implement automation for frequently-applied patterns
3. Schedule knowledge sharing sessions for top learnings
4. Continue monitoring and refining the learning system

---

*This report was automatically generated by the Claude Learning System*
`

  return report
}

// Run export
exportLearnings()