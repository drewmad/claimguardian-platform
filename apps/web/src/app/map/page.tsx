'use client';

import { useState } from 'react';
import { PropertyMap } from '@/components/map/PropertyMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Home, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import DashboardLayout from '@/components/layouts/dashboard-layout';

export default function MapPage() {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
  };

  const handleSearch = async () => {
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Map Section */}
        <div className="flex-1 relative">
          <PropertyMap 
            className="h-full"
            onPropertySelect={handlePropertySelect}
          />
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <div className="p-4">
            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Search by address, owner, or parcel ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Property Details or Statistics */}
            {selectedProperty ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Owner</p>
                    <p className="font-semibold">{selectedProperty.OWN_NAME || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p>{selectedProperty.PHY_ADDR1 || 'N/A'}</p>
                    <p>{selectedProperty.PHY_CITY}, FL {selectedProperty.PHY_ZIPCD}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Parcel ID</p>
                    <p className="font-mono">{selectedProperty.PARCEL_ID}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Just Value</p>
                    <p className="text-xl font-bold text-green-400">
                      ${(selectedProperty.JV || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <Button className="w-full mb-2">
                      View Full Details
                    </Button>
                    <Button variant="outline" className="w-full">
                      Start Claim Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                  <TabsTrigger value="claims">Claims</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Florida Property Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Properties</span>
                        <span className="text-white font-bold">8.2M</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Counties Loaded</span>
                        <span className="text-white font-bold">67</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Value</span>
                        <span className="text-green-400 font-bold">$2.1T</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Market Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 space-y-2">
                      <p className="text-sm">Average property value increased 12% YoY</p>
                      <p className="text-sm">Insurance premiums up 35% statewide</p>
                      <p className="text-sm">45% of properties in flood zones</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risks" className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">High Risk</span>
                          <span className="text-red-400 font-bold">1.2M properties</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: '15%'}}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Medium Risk</span>
                          <span className="text-amber-400 font-bold">2.8M properties</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{width: '35%'}}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Low Risk</span>
                          <span className="text-green-400 font-bold">4.2M properties</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '50%'}}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="claims" className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        Claims Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Active Claims</span>
                        <span className="text-red-400 font-bold">12,453</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Pending Review</span>
                        <span className="text-amber-400 font-bold">3,291</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Settled (30d)</span>
                        <span className="text-green-400 font-bold">8,723</span>
                      </div>
                      <div className="pt-3 border-t border-gray-700">
                        <p className="text-sm text-gray-400">Average Settlement</p>
                        <p className="text-2xl font-bold text-white">$47,892</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}