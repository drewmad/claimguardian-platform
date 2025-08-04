/**
 * @fileMetadata
 * @purpose Application header component, displaying logo, notifications, and user profile.
 * @owner frontend-team
 * @dependencies ["lucide-react", "@/lib/mock-data"]
 * @exports ["Header"]
 * @complexity low
 * @tags ["component", "layout", "header", "ui"]
 * @status active
 */
import { Bell } from 'lucide-react';
import Image from 'next/image';

import { MOCK_DATA } from '../../lib/mock-data';

interface HeaderProps {
  onProfileClick: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

const Header = ({ onProfileClick }: HeaderProps) => (
  <header className="flex-shrink-0 bg-bgSecondary h-16 flex items-center justify-between px-4 md:px-6 border-b border-border">
    <div className="flex items-center">
      <h1 className="font-slab text-xl md:text-2xl font-bold">Claim<span className="neon-lime-text">Guardian</span></h1>
    </div>
    <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-bgTertiary"><Bell size={20} /></button>
        <button onClick={onProfileClick} className="rounded-full">
          <Image src={MOCK_DATA.user.avatar} alt="User Avatar" width={32} height={32} className="rounded-full" />
        </button>
    </div>
  </header>
);

export default Header;
