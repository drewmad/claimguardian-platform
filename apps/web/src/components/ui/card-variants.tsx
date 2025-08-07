/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Standardized card variants for consistent design system"
 * @dependencies ["react", "clsx"]
 * @status stable
 */
"use client";

import { cn } from "@/lib/utils";
import {
  Card as BaseCard,
  CardContent as BaseCardContent,
  CardHeader as BaseCardHeader,
  CardTitle as BaseCardTitle,
  CardDescription as BaseCardDescription,
} from "./card";
import React from "react";

export type CardVariant =
  | "default"
  | "insurance"
  | "property"
  | "claim"
  | "elevated"
  | "interactive"
  | "danger";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  blur?: boolean;
}

const cardVariants = {
  default: "bg-gray-800 border-gray-700",
  insurance: "bg-gray-800/50 border-gray-700/50 backdrop-blur",
  property: "bg-gray-800/50 border-gray-700/50 backdrop-blur-sm",
  claim: "bg-gray-800/60 border-blue-900/30 backdrop-blur",
  elevated: "bg-gray-800 border-gray-700 shadow-xl",
  interactive:
    "bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer",
  danger: "bg-red-950/20 border-red-900/30 backdrop-blur",
};

export function Card({
  variant = "default",
  blur = false,
  className,
  ...props
}: CardProps) {
  return (
    <BaseCard
      className={cn(cardVariants[variant], blur && "backdrop-blur", className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <BaseCardHeader className={cn(className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <BaseCardTitle className={cn("text-white", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <BaseCardDescription
      className={cn("text-gray-400", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <BaseCardContent className={cn(className)} {...props} />;
}

// Export all for convenience
export { Card as StandardCard };

// Export the CardVariants type for compatibility
export type CardVariants = CardVariant;
