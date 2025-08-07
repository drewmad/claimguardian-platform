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
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function MobileCard({
  children,
  className,
  onClick,
  interactive = false,
}: MobileCardProps) {
  const isClickable = interactive || !!onClick;

  return (
    <motion.div
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      className={cn(
        "bg-gray-800 rounded-xl shadow-lg",
        "transition-all duration-200",
        isClickable && "active:shadow-md cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function MobileCardHeader({
  title,
  subtitle,
  action,
  icon,
}: MobileCardHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {icon && <div className="p-2 bg-gray-700 rounded-lg">{icon}</div>}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="ml-2 flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function MobileCardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

// Swipeable card variant
interface SwipeableCardProps extends MobileCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
}

export function SwipeableCard({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  ...props
}: SwipeableCardProps) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.2}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = offset.x * velocity.x;

        if (swipe < -10000 && onSwipeLeft) {
          onSwipeLeft();
        } else if (swipe > 10000 && onSwipeRight) {
          onSwipeRight();
        }
      }}
      className="relative"
    >
      {/* Background actions */}
      {leftAction && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          {rightAction}
        </div>
      )}

      {/* Main card */}
      <MobileCard className={className} {...props}>
        {children}
      </MobileCard>
    </motion.div>
  );
}
