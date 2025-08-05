/// <reference types="@testing-library/jest-dom" />

declare namespace jest {
  interface Matchers<R> {
    toBeRequired(): R
    toHaveAttribute(attr: string, value?: string): R
    toBeInTheDocument(): R
    toHaveClass(className: string): R
    toHaveTextContent(text: string): R
    toBeVisible(): R
    toBeDisabled(): R
    toBeEnabled(): R
    toHaveValue(value: string | number): R
    toBeChecked(): R
    toHaveFocus(): R
    toBeInvalid(): R
    toBeValid(): R
  }
}
