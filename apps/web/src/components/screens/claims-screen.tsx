/**
 * @fileMetadata
 * @purpose Displays a history of insurance claims with their status and details.
 * @owner frontend-team
 * @dependencies ["lucide-react", "@/lib/mock-data", "@/lib/constants"]
 * @exports ["ClaimsScreen"]
 * @complexity medium
 * @tags ["screen", "claims", "history"]
 * @status active
 */
import { Plus } from 'lucide-react';
import { MOCK_DATA } from '@/lib/mock-data';
import { COLORS } from '@/lib/constants';

const ClaimsScreen = ({ onStartClaim }) => {
    const getStatusChip = (status) => {
        switch (status) {
            case 'Approved': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.success, color: '#000'}}>{status}</span>;
            case 'Paid': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.info, color: '#fff'}}>{status}</span>;
            case 'Pending': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.warning, color: '#000'}}>{status}</span>;
            case 'Denied': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.danger, color: '#fff'}}>{status}</span>;
            default: return <span className="px-2 py-1 text-xs font-medium bg-bgTertiary text-textSecondary rounded-full">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <h2 className="font-slab text-2xl md:text-3xl font-bold">Claims History</h2>
                <button onClick={onStartClaim} className="accent-blue-bg hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <Plus size={18}/> New Claim
                </button>
            </div>
            <div className="bg-bgSecondary rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-bgTertiary">
                            <tr>
                                <th className="p-4 font-semibold">Claim ID</th>
                                <th className="p-4 font-semibold">Asset</th>
                                <th className="p-4 font-semibold">Incident</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_DATA.claims.map(claim => (
                                <tr key={claim.id} className="border-t border-border hover:bg-bgTertiary cursor-pointer">
                                    <td className="p-4 font-mono text-sm">{claim.id}</td>
                                    <td className="p-4">{claim.asset}</td>
                                    <td className="p-4">{claim.incident}</td>
                                    <td className="p-4">{claim.date}</td>
                                    <td className="p-4">{getStatusChip(claim.status)}</td>
                                    <td className="p-4 text-right font-semibold">${claim.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClaimsScreen;
