import { Bot } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { COLORS } from '@/lib/constants';

const AiChatButton = ({ onClick }) => (
    <button onClick={onClick} className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 accent-blue-bg w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
        <Bot size={32} className="text-white"/>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full neon-lime-bg opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 neon-lime-bg"></span>
        </span>
    </button>
);

export default AiChatButton;
