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
import { COLORS } from '@/lib/constants';
import React, { useState, useEffect } from 'react';

const ClaimsScreen = ({ onStartClaim }) => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const response = await fetch('/api/v1/claims');
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                const data = await response.json();
                setClaims(data.claims);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchClaims();
    }, []);

    const getStatusChip = (status) => {
        switch (status) {
            case 'Approved': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.success, color: '#000'}}>{status}</span>;
            case 'Paid': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.info, color: '#fff'}}>{status}</span>;
            case 'Pending': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.warning, color: '#000'}}>{status}</span>;
            case 'Denied': return <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: COLORS.danger, color: '#fff'}}>{status}</span>;
            default: return <span className="px-2 py-1 text-xs font-medium bg-bgTertiary text-textSecondary rounded-full">{status}</span>;
        }
    };

    if (loading) return <div className="text-center">Loading claims...</div>;
    if (error) return <div className="text-center text-danger-red-text">Error: {error}</div>;

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
                            {claims.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-textSecondary">No claims found.</td>
                                </tr>
                            ) : (
                                claims.map(claim => (
                                    <tr key={claim.id} className="border-t border-border hover:bg-bgTertiary cursor-pointer">
                                        <td className="p-4 font-mono text-sm">{claim.id}</td>
                                        <td className="p-4">{claim.property_id}</td> {/* Display property_id for now */}
                                        <td className="p-4">{claim.claim_details?.incident_type}</td>
                                        <td className="p-4">{new Date(claim.claim_details?.incident_date).toLocaleDateString()}</td>
                                        <td className="p-4">{getStatusChip(claim.status?.current)}</td>
                                        <td className="p-4 text-right font-semibold">${claim.financial?.total?.toLocaleString() || 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClaimsScreen;
