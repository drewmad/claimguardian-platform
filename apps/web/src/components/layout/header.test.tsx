import { render, screen } from '@testing-library/react';
import Header from '@/components/layout/header';

describe('Header', () => {
  it('renders the ClaimGuardian title', () => {
    render(<Header onMenuClick={() => {}} onProfileClick={() => {}} isMobile={false} />);
    expect(screen.getByText('ClaimGuardian')).toBeInTheDocument();
  });

  it('renders the Bell icon button', () => {
    render(<Header onMenuClick={() => {}} onProfileClick={() => {}} isMobile={false} />);
    expect(screen.getByRole('button', { name: /bell/i })).toBeInTheDocument();
  });

  it('renders the user avatar button', () => {
    render(<Header onMenuClick={() => {}} onProfileClick={() => {}} isMobile={false} />);
    expect(screen.getByRole('button', { name: /user avatar/i })).toBeInTheDocument();
  });
});
