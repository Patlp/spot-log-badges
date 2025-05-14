
import { useState, useCallback, ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, MapPin } from "lucide-react";
import { Place } from "./PlacesList";

interface CheckInTabsProps {
  nearbyPlaces: Place[];
  isLoadingPlaces: boolean;
  useLocation: boolean;
  onTabChange: (tab: string) => void;
  manualTabContent: ReactNode;
  nearbyTabContent: ReactNode;
}

export function CheckInTabs({ 
  nearbyPlaces, 
  isLoadingPlaces, 
  useLocation,
  onTabChange,
  manualTabContent,
  nearbyTabContent
}: CheckInTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("manual");

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    onTabChange(value);
  }, [onTabChange]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">
          <Building className="h-4 w-4 mr-2" />
          Manual Entry
        </TabsTrigger>
        <TabsTrigger 
          value="nearby" 
          disabled={isLoadingPlaces || (nearbyPlaces.length === 0 && useLocation && !isLoadingPlaces)}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {nearbyPlaces.length > 0 
            ? `Nearby Places (${nearbyPlaces.length})` 
            : 'Nearby Places'}
        </TabsTrigger>
      </TabsList>

      {/* Manual Entry Tab */}
      <TabsContent value="manual" className="pt-4">
        {manualTabContent}
      </TabsContent>

      {/* Nearby Places Tab */}
      <TabsContent value="nearby" className="pt-4">
        {nearbyTabContent}
      </TabsContent>
    </Tabs>
  );
}
