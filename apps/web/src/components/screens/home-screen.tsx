/**
 * @fileMetadata
 * @purpose Displays the main dashboard with overall risk, live alerts, and recent activity.
 * @owner frontend-team
 * @dependencies ["lucide-react", "@/lib/constants", "@/lib/mock-data"]
 * @exports ["HomeScreen"]
 * @complexity medium
 * @tags ["screen", "dashboard", "home"]
 * @status active
 */
import { Plus, FileText, User } from 'lucide-react';
import { COLORS } from '@/lib/constants';
import { MOCK_DATA } from '@/lib/mock-data';

const HomeScreen = ({ onStartClaim, onAddAsset }) => {
  const getRiskColor = (level) => {
    if (level < 40) return COLORS.success;
    if (level < 80) return COLORS.warning;
    return COLORS.danger;
  };
  
  const riskColor = getRiskColor(MOCK_DATA.risk.level);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="font-slab text-2xl md:text-3xl font-bold">Welcome back, {MOCK_DATA.user.name.split(' ')[0]}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-bgSecondary p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="font-slab text-lg font-bold mb-4">Overall Portfolio Risk</h3>
            <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={COLORS.border} strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={riskColor} strokeWidth="3" strokeDasharray={`${MOCK_DATA.risk.level}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-slab text-4xl font-bold" style={{color: riskColor}}>{MOCK_DATA.risk.level}%</span>
                    <span className="text-sm font-medium" style={{color: riskColor}}>{MOCK_DATA.risk.status} Risk</span>
                </div>
            </div>
            <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={onAddAsset} className="bg-bgTertiary hover:bg-border text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2"><Plus size={16} /> Add Asset</button>
                <button onClick={onStartClaim} className="accent-blue-bg hover:opacity-90 text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2"><FileText size={16} /> Start Claim</button>
                <button className="bg-bgTertiary hover:bg-border text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2"><User size={16} /> Contact Agent</button>
            </div>
        </div>

        <div className="lg:col-span-2 bg-bgSecondary p-6 rounded-lg shadow-md">
            <h3 className="font-slab text-lg font-bold mb-4">Live Alerts</h3>
            <div className="space-y-4">
                {MOCK_DATA.alerts.map(alert => (
                    <div key={alert.id} className="flex items-start p-4 rounded-lg bg-bgTertiary border-l-4" style={{borderColor: alert.color}}>
                        <alert.icon size={24} className="flex-shrink-0 mt-1" style={{color: alert.color}}/>
                        <div className="ml-4 flex-grow">
                            <p className="font-bold">{alert.title}</p>
                            <p className="text-sm text-textSecondary">{alert.description}</p>
                        </div>
                        <span className="text-xs text-textSecondary flex-shrink-0 ml-4">{alert.time}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
        <h3 className="font-slab text-lg font-bold mb-4">Recent Activity Timeline</h3>
        <div className="space-y-4">
            {MOCK_DATA.activity.map(item => (
                <div key={item.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-bgTertiary flex items-center justify-center mr-4">
                        <item.icon size={18} className="text-textSecondary" />
                    </div>
                    <p className="flex-grow text-sm">{item.text}</p>
                    <span className="text-xs text-textSecondary">{item.time}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
