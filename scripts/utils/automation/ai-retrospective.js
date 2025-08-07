#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AIRetrospective {
  constructor(agent) {
    this.agent = agent;
    this.retrospectivePath = path.join(
      process.cwd(),
      '.ai-context/retrospectives',
      `${agent}-runs.jsonl`
    );
  }

  async captureTaskOutcome(taskName, taskFunction) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const errors = [];
    const warnings = [];
    const lessons = [];
    const improvements = [];

    let outcome = 'success';
    let result;

    try {
      // Capture console warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        warnings.push(args.join(' '));
        originalWarn(...args);
      };

      // Execute task
      result = await taskFunction();

      // Restore console
      console.warn = originalWarn;

    } catch (error) {
      outcome = 'failure';
      errors.push(error.message);

      // Analyze error for lessons
      if (error.message.includes('lockfile')) {
        lessons.push('Always run pnpm install after package.json changes');
        improvements.push('Add pre-flight check for lockfile sync');
      }
      if (error.message.includes('type error')) {
        lessons.push('Validate TypeScript types before committing');
        improvements.push('Run tsc --noEmit in pre-task validation');
      }
    }

    // Calculate metrics
    const duration = Date.now() - startTime;
    const memoryDelta = process.memoryUsage().heapUsed - startMemory.heapUsed;

    // Git diff analysis
    let filesChanged = 0;
    try {
      const diff = execSync('git diff --name-only', { encoding: 'utf8' });
      filesChanged = diff.split('\n').filter(f => f).length;
    } catch (e) {
      // No git repo or no changes
    }

    // Log retrospective
    const retrospective = {
      timestamp: new Date().toISOString(),
      agent: this.agent,
      task: taskName,
      duration,
      outcome,
      errors,
      warnings,
      lessons,
      improvements,
      metrics: {
        memoryUsed: memoryDelta,
        filesChanged,
        linesOfCode: this.countLinesChanged()
      }
    };

    fs.appendFileSync(this.retrospectivePath, JSON.stringify(retrospective) + '\n');

    return { result, retrospective };
  }

  countLinesChanged() {
    try {
      const stats = execSync('git diff --stat', { encoding: 'utf8' });
      const match = stats.match(/(\d+) insertions.*(\d+) deletions/);
      if (match) {
        return parseInt(match[1]) + parseInt(match[2]);
      }
    } catch (e) {
      // No git repo or no changes
    }
    return 0;
  }

  async analyzeHistory() {
    if (!fs.existsSync(this.retrospectivePath)) {
      return { lessons: [], patterns: [] };
    }

    const lines = fs.readFileSync(this.retrospectivePath, 'utf8').split('\n');
    const retrospectives = lines
      .filter(l => l)
      .map(l => JSON.parse(l));

    // Analyze patterns
    const errorFrequency = {};
    const taskDurations = {};
    const allLessons = [];

    retrospectives.forEach(r => {
      // Track error patterns
      r.errors.forEach(e => {
        errorFrequency[e] = (errorFrequency[e] || 0) + 1;
      });

      // Track task performance
      if (!taskDurations[r.task]) {
        taskDurations[r.task] = [];
      }
      taskDurations[r.task].push(r.duration);

      // Collect lessons
      allLessons.push(...r.lessons);
    });

    // Generate insights
    const insights = {
      commonErrors: Object.entries(errorFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      avgDurations: Object.entries(taskDurations).map(([task, durations]) => ({
        task,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length
      })),
      uniqueLessons: [...new Set(allLessons)],
      successRate: retrospectives.filter(r => r.outcome === 'success').length / retrospectives.length
    };

    return insights;
  }
}

module.exports = AIRetrospective;

// CLI usage
if (require.main === module) {
  const [,, command, agent] = process.argv;
  const retro = new AIRetrospective(agent || 'system');

  if (command === 'analyze') {
    retro.analyzeHistory().then(insights => {
      console.log(' Retrospective Analysis:');
      console.log(JSON.stringify(insights, null, 2));
    });
  }
}
