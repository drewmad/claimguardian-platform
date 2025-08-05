/**
 * @fileMetadata
 * @purpose "Tests for Button UI component"
 * @owner ui-team
 * @dependencies ["vitest", "@testing-library/react", "@testing-library/user-event"]
 * @exports []
 * @complexity low
 * @tags ["test", "ui", "component", "button"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:55:00Z
 */

import { describe, it, expect, afterEach, jest } from '@jest/globals'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@claimguardian/ui'

describe('Button Component', () => {
  afterEach(() => {
    cleanup()
  })
  describe('Basic Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>)
      
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Test</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should forward ref correctly', () => {
      const ref = jest.fn()
      render(<Button ref={ref}>Test</Button>)
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
    })
  })

  describe('Button Variants', () => {
    it('should render default variant', () => {
      render(<Button>Default</Button>)
      
      const button = screen.getByRole('button')
      // Check for actual default classes used by the Button component
      expect(button).toHaveClass('bg-accent', 'text-text-primary')
    })

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      
      const button = screen.getByRole('button')
      // Update assertion for actual destructive classes  
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-border')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-panel', 'text-text-primary')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-panel')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-accent', 'underline-offset-4')
    })
  })

  describe('Button Sizes', () => {
    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3', 'text-sm')
    })

    it('should render default size', () => {
      render(<Button>Default</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-8', 'text-base')
    })

    it('should render icon size', () => {
      render(<Button size="icon">⚙️</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('Button States', () => {
    it('should be clickable when enabled', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      await user.click(screen.getByRole('button'))
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', () => {
      const handleClick = jest.fn()
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      
      await user.click(screen.getByRole('button'))
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should show loading state', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should hide text when loading and loadingText not provided', () => {
      render(<Button loading>Click me</Button>)
      
      expect(screen.queryByText('Click me')).not.toBeInTheDocument()
    })

    it('should show loading text when provided', () => {
      render(<Button loading loadingText="Processing...">Submit</Button>)
      
      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })
  })

  describe('Button Types', () => {
    it('should render as button type by default', () => {
      render(<Button>Default</Button>)
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('should render as submit type when specified', () => {
      render(<Button type="submit">Submit</Button>)
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('should render as reset type when specified', () => {
      render(<Button type="reset">Reset</Button>)
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have proper ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>)
      
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="help-text">Submit</Button>
          <div id="help-text">This will submit the form</div>
        </>
      )
      
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup()
      render(<Button>Focus me</Button>)
      
      await user.tab()
      
      expect(screen.getByRole('button')).toHaveFocus()
    })

    it('should be activatable with Enter key', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Press Enter</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be activatable with Space key', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Press Space</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Icon Support', () => {
    it('should render with left icon', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>
          Back
        </Button>
      )
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByText('Back')).toBeInTheDocument()
    })

    it('should render with right icon', () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">→</span>}>
          Next
        </Button>
      )
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should render with both icons', () => {
      render(
        <Button 
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Middle
        </Button>
      )
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
      expect(screen.getByText('Middle')).toBeInTheDocument()
    })

    it('should render icon-only button', () => {
      render(
        <Button size="icon" aria-label="Settings">
          <span data-testid="settings-icon">⚙️</span>
        </Button>
      )
      
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    })
  })

  describe('Event Handling', () => {
    it('should handle onClick events', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      await user.click(screen.getByRole('button'))
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle onFocus events', async () => {
      const user = userEvent.setup()
      const handleFocus = jest.fn()
      
      render(<Button onFocus={handleFocus}>Focus me</Button>)
      
      await user.tab()
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should handle onBlur events', async () => {
      const user = userEvent.setup()
      const handleBlur = jest.fn()
      
      render(
        <>
          <Button onBlur={handleBlur}>First</Button>
          <Button>Second</Button>
        </>
      )
      
      const firstButton = screen.getByRole('button', { name: 'First' })
      await user.click(firstButton)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should prevent double-clicks when processing', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn(() => {
        // Simulate async operation
        return new Promise(resolve => setTimeout(resolve, 100))
      })
      
      render(<Button onClick={handleClick}>Submit</Button>)
      
      const button = screen.getByRole('button')
      await user.dblClick(button)
      
      // Should only be called once due to loading state
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Integration', () => {
    it('should submit form when type="submit"', async () => {
      const user = userEvent.setup()
      const handleSubmit = jest.fn(e => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      )
      
      await user.click(screen.getByRole('button'))
      
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('should reset form when type="reset"', async () => {
      const user = userEvent.setup()
      
      render(
        <form>
          <input defaultValue="test" data-testid="input" />
          <Button type="reset">Reset Form</Button>
        </form>
      )
      
      const input = screen.getByTestId('input') as HTMLInputElement
      expect(input.value).toBe('test')
      
      await user.click(screen.getByRole('button'))
      
      expect(input.value).toBe('')
    })
  })
})