#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

class AIContextSync {
  constructor() {
    this.contextRoot = path.join(process.cwd(), '.ai-context');
    this.syncManifest = this.loadSyncManifest();
    this.sharedContext = this.loadSharedContext();
  }

  loadSyncManifest() {
    return JSON.parse(
      fs.readFileSync(path.join(this.contextRoot, 'sync-manifest.json'), 'utf8')
    );
  }

  loadSharedContext() {
    return yaml.parse(
      fs.readFileSync(path.join(this.contextRoot, 'shared/project-context.yaml'), 'utf8')
    );
  }

  async syncContexts() {
    const startTime = Date.now();
    const contexts = {};
    const conflicts = [];
    
    // Load all agent contexts
    for (const agent of this.syncManifest.agents) {
      const agentPath = path.join(this.contextRoot, agent);
      if (fs.existsSync(agentPath)) {
        contexts[agent] = this.loadAgentContext(agent);
      }
    }
    
    // Detect conflicts
    const allKeys = new Set();
    Object.values(contexts).forEach(ctx => {
      Object.keys(ctx).forEach(key => allKeys.add(key));
    });
    
    for (const key of allKeys) {
      const values = {};
      Object.entries(contexts).forEach(([agent, ctx]) => {
        if (ctx[key]) values[agent] = ctx[key];
      });
      
      if (Object.keys(values).length > 1) {
        const uniqueValues = [...new Set(Object.values(values))];
        if (uniqueValues.length > 1) {
          conflicts.push({
            key,
            values,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Update manifest
    this.syncManifest.lastSync = new Date().toISOString();
    this.syncManifest.conflicts = conflicts;
    fs.writeFileSync(
      path.join(this.contextRoot, 'sync-manifest.json'),
      JSON.stringify(this.syncManifest, null, 2)
    );
    
    // Log retrospective
    this.logRetrospective({
      task: 'context_sync',
      duration: Date.now() - startTime,
      outcome: conflicts.length > 0 ? 'partial' : 'success',
      conflicts: conflicts.length,
      warnings: conflicts.map(c => `Conflict on key: ${c.key}`)
    });
    
    return { conflicts, duration: Date.now() - startTime };
  }

  logRetrospective(data) {
    const retrospective = {
      timestamp: new Date().toISOString(),
      agent: 'system',
      ...data
    };
    
    const logPath = path.join(this.contextRoot, 'retrospectives/system-sync.jsonl');
    fs.appendFileSync(logPath, JSON.stringify(retrospective) + '\n');
  }
}

// Run sync
if (require.main === module) {
  const sync = new AIContextSync();
  sync.syncContexts().then(result => {
    if (result.conflicts.length > 0) {
      console.error(`⚠️  Found ${result.conflicts.length} conflicts`);
      process.exit(1);
    } else {
      console.log('✅ All contexts synchronized');
    }
  });
}

module.exports = AIContextSync;
