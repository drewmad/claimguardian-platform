/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find((shortcut) => {
        if (shortcut.disabled) return false;

        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!event.ctrlKey === !!shortcut.ctrlKey;
        const altMatches = !!event.altKey === !!shortcut.altKey;
        const shiftMatches = !!event.shiftKey === !!shortcut.shiftKey;
        const metaMatches = !!event.metaKey === !!shortcut.metaKey;

        return (
          keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const showShortcutsHelp = useCallback(() => {
    const helpText = shortcuts
      .filter((s) => !s.disabled)
      .map((s) => {
        const modifiers = [];
        if (s.ctrlKey) modifiers.push("Ctrl");
        if (s.altKey) modifiers.push("Alt");
        if (s.shiftKey) modifiers.push("Shift");
        if (s.metaKey) modifiers.push("⌘");

        const keyCombo = [...modifiers, s.key.toUpperCase()].join("+");
        return `${keyCombo}: ${s.description}`;
      })
      .join("\n");

    toast.info("Keyboard Shortcuts", {
      description: helpText,
      duration: 5000,
    });
  }, [shortcuts]);

  return { showShortcutsHelp };
}

// AI-specific keyboard shortcuts
export function useAIKeyboardShortcuts({
  onUpload,
  onSubmit,
  onEscape,
  onShowHelp,
  uploadDisabled = false,
  submitDisabled = false,
}: {
  onUpload?: () => void;
  onSubmit?: () => void;
  onEscape?: () => void;
  onShowHelp?: () => void;
  uploadDisabled?: boolean;
  submitDisabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "u",
      ctrlKey: true,
      action: onUpload || (() => {}),
      description: "Upload files",
      disabled: !onUpload || uploadDisabled,
    },
    {
      key: "Enter",
      ctrlKey: true,
      action: onSubmit || (() => {}),
      description: "Submit/Analyze",
      disabled: !onSubmit || submitDisabled,
    },
    {
      key: "Escape",
      action: onEscape || (() => {}),
      description: "Close modal/Clear",
      disabled: !onEscape,
    },
    {
      key: "?",
      action: onShowHelp || (() => {}),
      description: "Show this help",
      disabled: !onShowHelp,
    },
  ];

  return useKeyboardShortcuts(shortcuts);
}
