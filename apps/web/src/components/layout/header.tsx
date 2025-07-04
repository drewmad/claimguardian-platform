import { Bell } from 'lucide-react';
import { MOCK_DATA } from '@/lib/mock-data';

const Header = ({ onMenuClick, onProfileClick, isMobile }) => (
  <header className="flex-shrink-0 bg-bgSecondary h-16 flex items-center justify-between px-4 md:px-6 border-b border-border">
    <div className="flex items-center">
      <h1 className="font-slab text-xl md:text-2xl font-bold">Claim<span className="neon-lime-text">Guardian</span></h1>
    </div>
    <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-bgTertiary"><Bell size={20} /></button>
        <button onClick={onProfileClick} className="rounded-full">
          <img src={MOCK_DATA.user.avatar} alt="User Avatar" className="w-8 h-8 rounded-full" />
        </button>
    </div>
  </header>
);

export default Header;
