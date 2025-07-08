declare module "@claimguardian/ui" {
  import * as React from 'react';
  import { VariantProps } from 'class-variance-authority';

  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<any> {}
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
  }
  export const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

  interface SimpleModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
  }
  export const Modal: React.FC<SimpleModalProps>;

  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;

  interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
  export const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;

  interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}
  export const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLButtonElement>>;

  function cn(...inputs: any[]): string;
  export { cn };
}