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
declare module "@claimguardian/ui" {
  import * as React from "react";

  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
  }
  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
  }
  export const Input: React.ForwardRefExoticComponent<
    InputProps & React.RefAttributes<HTMLInputElement>
  >;

  interface SimpleModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
  }
  export const Modal: React.FC<SimpleModalProps>;

  export const Card: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;

  export const Label: React.ForwardRefExoticComponent<
    React.LabelHTMLAttributes<HTMLLabelElement> &
      React.RefAttributes<HTMLLabelElement>
  >;

  interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
  }
  export const Checkbox: React.ForwardRefExoticComponent<
    CheckboxProps & React.RefAttributes<HTMLButtonElement>
  >;

  function cn(...inputs: (string | undefined | null | boolean)[]): string;
  export { cn };
}
