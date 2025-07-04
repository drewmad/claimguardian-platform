/**
 * @fileMetadata
 * @purpose Provides a bottom navigation bar for mobile devices.
 * @owner frontend-team
 * @dependencies ["lucide-react"]
 * @exports ["BottomNav"]
 * @complexity low
 * @tags ["component", "layout", "navigation", "mobile"]
 * @status active
 */
import { Home, Shield, FileText, Camera } from 'lucide-react';

const BottomNav = ({ activeScreen, setActiveScreen }) => {
  const navItems = [
    { name: 'Home', icon: Home },
    { name: 'Assets', icon: Shield },
    { name: 'Assess', icon: Camera },
    { name: 'Claims', icon: FileText },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bgSecondary border-t border-border flex justify-around h-16 z-50">
      {navItems.map(item => (
        <button
          key={item.name}
          onClick={() => setActiveScreen(item.name)}
          className={`flex flex-col items-center justify-center w-full pt-2 transition-colors ${activeScreen === item.name ? 'accent-blue-text' : 'text-textSecondary hover:bg-bgTertiary'}`}
        >
          <item.icon size={24} />
          <span className="text-xs mt-1">{item.name}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
