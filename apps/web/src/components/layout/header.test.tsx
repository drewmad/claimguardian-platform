import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';
import Header from '@/components/layout/header';

describe('Header', () => {
  it('renders the ClaimGuardian title', () => {
    render(<Header onProfileClick={() => {}} />);
    expect(screen.getByText('ClaimGuardian')).toBeInTheDocument();
  });

  it('renders the Bell icon button', () => {
    render(<Header onProfileClick={() => {}} />);
    expect(screen.getByRole('button', { name: /bell/i })).toBeInTheDocument();
  });

  it('renders the user avatar button', () => {
    render(<Header onProfileClick={() => {}} />);
    expect(screen.getByRole('button', { name: /user avatar/i })).toBeInTheDocument();
  });
});
