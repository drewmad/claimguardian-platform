import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiFilter, FiAlertTriangle, FiTwitter } from 'react-icons/fi';
import { useWebSocketContext } from '../../context/WebSocketContext';

// Interface for a unified feed item
interface FeedItem {
  id: string;
  type: 'x_post' | 'community_report' | 'official_alert';
  timestamp: string;
  content: string;
  author?: string;
  relevancy?: number;
  sentiment?: string;
}

const LiveFeed: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'x_post' | 'community_report'>('all');
  const { lastMessage } = useWebSocketContext();

  // Process new messages from WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        const newItem = transformDataToFeedItem(data);
        if (newItem) {
            // Prepend new item to the feed and sort
            setFeedItems(prevItems => [newItem, ...prevItems].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }
      } catch (error) {
        console.error('Error processing WebSocket message in LiveFeed:', error);
      }
    }
  }, [lastMessage]);

  // Transform incoming data (WebSocket) to unified FeedItem format
  const transformDataToFeedItem = (data: any): FeedItem | null => {
    // Handle Community Report GeoJSON format
    if (data.type === 'Feature' && data.properties && data.properties.report_type) {
        return {
            id: data.properties.id.toString(),
            type: 'community_report',
            timestamp: data.properties.report_timestamp,
            content: `${data.properties.report_type}: ${data.properties.description || 'No description provided.'}`,
        };
    }
    // Handle X Post format (if implemented and broadcasted)
    // ...
    
    return null;
  };

  // Filtered items based on selected filter
  const filteredItems = useMemo(() => {
    return feedItems.filter(item => filter === 'all' || item.type === filter);
  }, [feedItems, filter]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">Real-Time Situational Feed</h2>
      
      {/* Filters */}
      <div className="flex mb-6 gap-3 items-center p-3 bg-gray-700 rounded-lg shadow-sm">
        <FiFilter className="text-gray-400" />
        <FilterButton label="All Updates" value="all" currentFilter={filter} setFilter={setFilter} />
        <FilterButton label="Community" value="community_report" currentFilter={filter} setFilter={setFilter} />
        <FilterButton label="X Posts" value="x_post" currentFilter={filter} setFilter={setFilter} />
      </div>

      {/* Feed Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 && (
            <p className="text-center text-gray-500">No recent activity. Awaiting real-time updates...</p>
        )}

        {filteredItems.map(item => (
          <FeedItemCard key={`${item.id}-${item.type}`} item={item} />
        ))}
      </div>
    </div>
  );
};

// Helper component for filter buttons
const FilterButton: React.FC<{ label: string, value: string, currentFilter: string, setFilter: (filter: any) => void }> = 
    ({ label, value, currentFilter, setFilter }) => (
    <button 
        onClick={() => setFilter(value)} 
        className={`px-4 py-1 text-sm rounded-full transition duration-150 ${
            currentFilter === value ? 'bg-eoc-primary text-white shadow-md' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
        }`}
    >
        {label}
    </button>
);

// Helper component for individual feed items
const FeedItemCard: React.FC<{ item: FeedItem }> = ({ item }) => {
    const getStyle = (type: string) => {
        switch (type) {
            case 'community_report':
                return { icon: <FiAlertTriangle className="text-eoc-accent" />, border: 'border-eoc-accent', label: 'Community Report' };
            case 'x_post':
                return { icon: <FiTwitter className="text-blue-400" />, border: 'border-blue-400', label: `@${item.author}` };
            default:
                return { icon: null, border: 'border-gray-500', label: 'Update' };
        }
    };

    const style = getStyle(item.type);

    return (
        <div className={`p-4 border-l-4 ${style.border} rounded-r-lg shadow-sm bg-gray-800 transition duration-150 hover:shadow-md`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    {style.icon}
                    <span className="text-sm font-semibold text-gray-300">{style.label}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
            </div>
            <p className="text-sm text-gray-100 leading-relaxed">{item.content}</p>
            {item.relevancy && (
                <div className="mt-2 text-xs text-gray-400">
                    Relevancy: {item.relevancy.toFixed(2)} | Sentiment: {item.sentiment}
                </div>
            )}
        </div>
    );
};

export default LiveFeed;
