/**
 * Enhanced Property Map Dashboard Page
 * Features: Property overlays, parcel search, risk layers, hurricane tracking
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EnhancedPropertyMap } from "@/components/maps/enhanced-property-map";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Home,
  Shield,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Wind,
  Droplets,
  Activity,
  Search,
  Filter,
  Download,
  Share2,
  Settings,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// Mock property data
const MOCK_PROPERTIES = [
  {
    id: "1",
    parcelId: "12-34-56-789",
    name: "Miami Beach Condo",
    address: "123 Ocean Drive, Miami Beach, FL 33139",
    coordinates: [-80.13, 25.7907] as [number, number],
    type: "condo" as const,
    value: 650000,
    insuranceStatus: "active" as const,
    claimsCount: 0,
    riskLevel: "medium" as const,
    county: "Miami-Dade",
    yearBuilt: 2018,
    squareFeet: 1200,
    floodZone: "AE",
    windZone: "1",
    lastUpdated: new Date(),
  },
  {
    id: "2",
    parcelId: "23-45-67-890",
    name: "Tampa Bay House",
    address: "456 Bayshore Blvd, Tampa, FL 33606",
    coordinates: [-82.4584, 27.9378] as [number, number],
    type: "single_family" as const,
    value: 450000,
    insuranceStatus: "active" as const,
    claimsCount: 1,
    riskLevel: "low" as const,
    county: "Hillsborough",
    yearBuilt: 2010,
    squareFeet: 2100,
    floodZone: "X",
    windZone: "2",
    lastUpdated: new Date(),
  },
  {
    id: "3",
    parcelId: "34-56-78-901",
    name: "Naples Investment Property",
    address: "789 Gulf Shore Dr, Naples, FL 34102",
    coordinates: [-81.8075, 26.1420] as [number, number],
    type: "multi_family" as const,
    value: 1250000,
    insuranceStatus: "expired" as const,
    claimsCount: 2,
    riskLevel: "high" as const,
    county: "Collier",
    yearBuilt: 2005,
    squareFeet: 3500,
    floodZone: "VE",
    windZone: "1",
    lastUpdated: new Date(),
  },
  {
    id: "4",
    parcelId: "45-67-89-012",
    name: "Orlando Commercial",
    address: "321 International Dr, Orlando, FL 32819",
    coordinates: [-81.4706, 28.4494] as [number, number],
    type: "commercial" as const,
    value: 2500000,
    insuranceStatus: "active" as const,
    claimsCount: 0,
    riskLevel: "low" as const,
    county: "Orange",
    yearBuilt: 2020,
    squareFeet: 8000,
    floodZone: "X",
    windZone: "3",
    lastUpdated: new Date(),
  },
  {
    id: "5",
    parcelId: "56-78-90-123",
    name: "Fort Lauderdale Townhouse",
    address: "654 Las Olas Blvd, Fort Lauderdale, FL 33301",
    coordinates: [-80.1373, 26.1201] as [number, number],
    type: "townhouse" as const,
    value: 380000,
    insuranceStatus: "pending" as const,
    claimsCount: 0,
    riskLevel: "medium" as const,
    county: "Broward",
    yearBuilt: 2015,
    squareFeet: 1800,
    floodZone: "AE",
    windZone: "1",
    lastUpdated: new Date(),
  },
];

export default function EnhancedPropertyMapPage() {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [properties, setProperties] = useState(MOCK_PROPERTIES);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate statistics
  const stats = {
    totalProperties: properties.length,
    totalValue: properties.reduce((sum, p) => sum + p.value, 0),
    activeInsurance: properties.filter(p => p.insuranceStatus === "active").length,
    highRisk: properties.filter(p => p.riskLevel === "high").length,
    totalClaims: properties.reduce((sum, p) => sum + p.claimsCount, 0),
    avgValue: properties.length > 0 
      ? properties.reduce((sum, p) => sum + p.value, 0) / properties.length 
      : 0,
  };

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    setActiveTab("details");
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(properties, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `properties-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    toast.success("Property data exported successfully");
  };

  const handleShareMap = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Map link copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Enhanced Property Map
            </h1>
            <p className="text-gray-400 mt-1">
              Advanced visualization with risk assessment and real-time data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareMap}
              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/property/add")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Properties</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalProperties}
                  </p>
                </div>
                <Home className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${(stats.totalValue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Active Coverage</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {stats.activeInsurance}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">High Risk</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {stats.highRisk}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total Claims</p>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.totalClaims}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Avg Value</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ${(stats.avgValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800 border-gray-700 overflow-hidden">
              <EnhancedPropertyMap
                properties={properties}
                onPropertyClick={handlePropertyClick}
                height="700px"
                showLayerPanel={true}
                showSearch={true}
                showControls={true}
              />
            </Card>
          </div>

          {/* Side Panel - 1 column */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="risks">Risks</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Counties</span>
                      <Badge className="bg-blue-600/20 text-blue-400">
                        {new Set(properties.map(p => p.county)).size}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Property Types</span>
                      <Badge className="bg-green-600/20 text-green-400">
                        {new Set(properties.map(p => p.type)).size}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Coverage Rate</span>
                      <Badge className="bg-purple-600/20 text-purple-400">
                        {((stats.activeInsurance / stats.totalProperties) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-gray-400">
                      <p>• Property added in Miami-Dade</p>
                      <p>• Insurance renewed for Tampa Bay House</p>
                      <p>• Risk assessment updated</p>
                      <p>• New hurricane track monitored</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {selectedProperty ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        {selectedProperty.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400">Address</p>
                        <p className="text-sm text-white">{selectedProperty.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Parcel ID</p>
                        <p className="text-sm text-white font-mono">
                          {selectedProperty.parcelId}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400">Type</p>
                          <p className="text-sm text-white capitalize">
                            {selectedProperty.type.replace("_", " ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">County</p>
                          <p className="text-sm text-white">{selectedProperty.county}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400">Value</p>
                          <p className="text-sm text-white font-semibold">
                            ${selectedProperty.value.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Sq Ft</p>
                          <p className="text-sm text-white">
                            {selectedProperty.squareFeet?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400">Year Built</p>
                          <p className="text-sm text-white">{selectedProperty.yearBuilt}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Insurance</p>
                          <Badge
                            className={
                              selectedProperty.insuranceStatus === "active"
                                ? "bg-green-600/20 text-green-400"
                                : selectedProperty.insuranceStatus === "expired"
                                ? "bg-red-600/20 text-red-400"
                                : "bg-orange-600/20 text-orange-400"
                            }
                          >
                            {selectedProperty.insuranceStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-700">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => router.push(`/dashboard/property/${selectedProperty.id}`)}
                        >
                          View Full Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12 text-center">
                      <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">
                        Click on a property marker to view details
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wind className="w-5 h-5" />
                      Hurricane Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Wind Zone 1</span>
                        <Badge className="bg-red-600/20 text-red-400">High</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Wind Zone 2</span>
                        <Badge className="bg-orange-600/20 text-orange-400">Medium</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Wind Zone 3</span>
                        <Badge className="bg-green-600/20 text-green-400">Low</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Droplets className="w-5 h-5" />
                      Flood Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Zone VE</span>
                        <Badge className="bg-red-600/20 text-red-400">Extreme</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Zone AE</span>
                        <Badge className="bg-orange-600/20 text-orange-400">High</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Zone X</span>
                        <Badge className="bg-green-600/20 text-green-400">Minimal</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Risk Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">
                      Based on current data, your properties face varying levels of risk
                      from natural disasters. Consider reviewing insurance coverage for
                      high-risk properties.
                    </p>
                    <Button
                      className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                      onClick={() => router.push("/dashboard/risk-assessment")}
                    >
                      Full Risk Assessment
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}