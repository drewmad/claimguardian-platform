/**
 * @fileMetadata
 * @purpose "Provides a customizable checkbox component built on Radix UI Checkbox."
 * @owner frontend-team
 * @dependencies ["react", "@radix-ui/react-checkbox", "lucide-react", "./utils"]
 * @exports ["Checkbox"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity low
 * @tags ["component", "ui", "form", "checkbox"]
 * @status stable
 * @notes Used for boolean input and form controls.
 */
"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";

import { CheckIcon } from "./icons";
import { cn } from "./utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-slate-600 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <CheckIcon className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
