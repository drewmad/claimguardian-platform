/**
 * @fileMetadata
 * @purpose "Toast hook for showing notifications"
 * @dependencies []
 * @owner frontend-team
 * @status stable
 */

type ToastVariant = "default" | "destructive";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    // For now, use console.log as a placeholder
    // In production, this would integrate with a proper toast library like Sonner
    const message = `${variant === "destructive" ? "❌" : "✅"} ${title}${description ? ": " + description : ""}`;
    console.log(message);

    // You could also use window.alert for immediate feedback during development
    if (typeof window !== "undefined") {
      // Simple notification using browser API if available
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title || "Notification", {
          body: description,
          icon: variant === "destructive" ? "❌" : "✅",
        });
      }
    }
  };

  return { toast };
}
