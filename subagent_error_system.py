#!/usr/bin/env python3
"""
Centralized Error Log System for ClaimGuardian.

Integrates with Claude Code CLI and subagents for error tracking and learning.
"""

import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Dict

# Cache for error log to reduce file I/O
_error_log_cache = None
_cache_timestamp = None


class SubagentErrorSystem:
    """System for tracking and managing subagent errors."""

    def __init__(self, project_root: str = None):
        """Initialize the error system.

        Args:
            project_root: Root directory of the project.
        """
        self.project_root = Path(project_root or os.getcwd())
        self.error_log_path = self.project_root / ".claude" / "errors" / "error_log.md"
        self.ensure_directories()

    def ensure_directories(self):
        """Ensure required directories exist."""
        self.error_log_path.parent.mkdir(parents=True, exist_ok=True)

    def load_error_log(self) -> str:
        """Load and cache the error log, returning relevant learnings."""
        global _error_log_cache, _cache_timestamp

        try:
            current_mtime = self.error_log_path.stat().st_mtime
            if _error_log_cache is None or _cache_timestamp != current_mtime:
                with open(self.error_log_path, "r", encoding="utf-8") as f:
                    _error_log_cache = f.read()
                _cache_timestamp = current_mtime
        except FileNotFoundError:
            _error_log_cache = "# Centralized Error Log\nNo entries yet."
            _cache_timestamp = None

        return _error_log_cache

    def extract_agent_learnings(self, agent_name: str = None) -> List[Dict]:
        """Extract agent-based learnings from error log."""
        content = self.load_error_log()
        learnings = []

        # Pattern to match error entries with agent-based learnings
        pattern = r"### (\d{4}-\d{2}-\d{2} \d{2}:\d{2})\n(.*?)(?=\n### |\Z)"
        matches = re.finditer(pattern, content, re.DOTALL)

        for match in matches:
            timestamp, entry_content = match.groups()

            # Extract agent-based learnings section
            learning_pattern = (
                r"- \*\*Agent-Based Learnings\*\*:" r"(.*?)(?=\n- \*\*|\n---|\Z)"
            )
            learning_match = re.search(learning_pattern, entry_content, re.DOTALL)

            if learning_match:
                learning_content = learning_match.group(1).strip()

                # Parse structured learning data
                subagent_match = re.search(r"- Subagent: (.+)", learning_content)
                insight_match = re.search(r"- Insight: (.+)", learning_content)
                fix_recipe_match = re.search(r"- Fix Recipe: (.+)", learning_content)
                optimization_match = re.search(
                    r"- Optimization: (.+)", learning_content
                )

                if subagent_match:
                    subagent = subagent_match.group(1).strip()

                    # Filter by agent name if specified
                    if agent_name and agent_name.lower() not in subagent.lower():
                        continue

                    learning_data = {
                        "timestamp": timestamp,
                        "subagent": subagent,
                        "insight": (
                            insight_match.group(1).strip() if insight_match else ""
                        ),
                        "fix_recipe": (
                            fix_recipe_match.group(1).strip()
                            if fix_recipe_match
                            else ""
                        ),
                        "optimization": (
                            optimization_match.group(1).strip()
                            if optimization_match
                            else ""
                        ),
                        "raw_content": learning_content,
                    }
                    learnings.append(learning_data)

        return learnings

    def format_learnings_for_context(self, learnings: List[Dict]) -> str:
        """Format learnings for subagent context."""
        if not learnings:
            return "No previous learnings available."

        formatted = []
        for learning in learnings[-10:]:  # Last 10 learnings to avoid context overflow
            entry = f"[{learning['timestamp']}] {learning['subagent']}"
            if learning["insight"]:
                entry += f"\n  - Insight: {learning['insight']}"
            if learning["fix_recipe"]:
                entry += f"\n  - Fix Recipe: {learning['fix_recipe']}"
            if learning["optimization"]:
                entry += f"\n  - Optimization: {learning['optimization']}"
            formatted.append(entry)

        return "\n\n".join(formatted)

    def start_subagent(self, agent_name: str, task: str, context: str = ""):
        """Start subagent with error log context."""
        learnings = self.extract_agent_learnings(agent_name)
        formatted_learnings = self.format_learnings_for_context(learnings)

        full_context = f"""Agent: {agent_name}
Task: {task}
Additional Context: {context}

Previous Error Learnings:
{formatted_learnings}

Instructions:
- Reference these learnings to avoid repeated errors
- If you encounter an error, use /log_error and /analyze_error commands
- Focus on patterns that match your agent type ({agent_name})
"""

        print(f"Starting subagent: {agent_name}")
        print(f"Task: {task}")
        print(f"Loaded {len(learnings)} relevant learnings from error log")

        try:
            # Use Claude Code CLI with context
            result = subprocess.run(
                ["claude", "--context", full_context],
                input=task,
                text=True,
                capture_output=True,
                check=True,
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            error_msg = f"Subagent execution failed: {e.stderr}"
            self.handle_error(error_msg, "subagent_error_system.py", agent_name, task)
            return None
        except FileNotFoundError:
            print("Claude Code CLI not found. Install with: pip install claude-code")
            return None

    def handle_error(
        self,
        error_message: str,
        file_path: str,
        agent_name: str = None,
        context: str = "",
    ):
        """Log and analyze errors using Claude commands."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Prepare error details for logging
        error_details = f"{error_message} in {file_path}"
        if context:
            error_details += f" - Context: {context}"

        print(f"Handling error: {error_message}")

        try:
            # Log error
            subprocess.run(["claude", "-p", f"/log_error {error_details}"], check=True)

            # Analyze error with agent context
            analysis_context = error_details
            if agent_name:
                analysis_context += f" - Agent: {agent_name}"

            subprocess.run(
                ["claude", "-p", f"/analyze_error {analysis_context}"], check=True
            )

            print(f"Error logged and analyzed in {self.error_log_path}")

        except subprocess.CalledProcessError as e:
            print(f"Failed to log error: {e}")
        except FileNotFoundError:
            print("Claude Code CLI not found. Error details:")
            print(f"  Timestamp: {timestamp}")
            print(f"  Error: {error_message}")
            print(f"  File: {file_path}")
            print(f"  Agent: {agent_name}")

    def get_error_patterns(self) -> Dict[str, int]:
        """Analyze error patterns for insights."""
        content = self.load_error_log()
        patterns = {}

        # Extract error types
        error_pattern = r"- \*\*Error\*\*: (.+)"
        matches = re.findall(error_pattern, content)

        for error in matches:
            # Extract error type (first word before :)
            error_type = error.split(":")[0].strip()
            patterns[error_type] = patterns.get(error_type, 0) + 1

        return patterns

    def clear_cache(self):
        """Clear the error log cache to force reload."""
        global _error_log_cache, _cache_timestamp
        _error_log_cache = None
        _cache_timestamp = None


def main():
    """Example usage of the SubagentErrorSystem."""
    system = SubagentErrorSystem()

    # Example: Start a subagent with error context
    if len(os.sys.argv) > 2:
        agent_name = os.sys.argv[1]
        task = " ".join(os.sys.argv[2:])
        result = system.start_subagent(agent_name, task)
        if result:
            print("Subagent completed successfully")
    else:
        print("Usage: python subagent_error_system.py <agent_name> <task>")
        print(
            "Example: python subagent_error_system.py ui-developer 'Fix button component styling'"
        )


if __name__ == "__main__":
    main()
