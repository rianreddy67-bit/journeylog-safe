import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { LocationTracker } from "@/components/LocationTracker";
import { LocationSharing } from "@/components/LocationSharing";
import { GeofenceManager } from "@/components/GeofenceManager";
import RealTimeNavigation from "@/components/RealTimeNavigation";
import { EmergencyAIAssistant } from "@/components/EmergencyAIAssistant";

const riskZones = [
  { name: "Downtown Market Area", risk: "Medium", reason: "Crowded area, pickpocketing reports" },
  { name: "Old City Bridge", risk: "High", reason: "Recent security incidents" },
  { name: "Riverside Park", risk: "Low", reason: "Well-patrolled area" },
];

export default function Safety() {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Safety Center</h1>
          <p className="text-muted-foreground">Your safety is our priority</p>
        </div>

        {/* Real-Time Navigation */}
        <RealTimeNavigation />

        {/* Location Tracking */}
        <LocationTracker />

        {/* Location Sharing */}
        <LocationSharing />

        {/* Geofence Management */}
        <GeofenceManager />

        {/* AI Emergency Assistant */}
        <EmergencyAIAssistant />

        {/* Risk Zones */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Area Risk Assessment</CardTitle>
            <CardDescription>Know before you go</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskZones.map((zone, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-sm text-muted-foreground">{zone.reason}</p>
                </div>
                <Badge 
                  variant={zone.risk === "High" ? "destructive" : zone.risk === "Medium" ? "secondary" : "default"}
                >
                  {zone.risk}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Safety Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                Keep your digital ID and emergency contacts easily accessible
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                Share your live location with trusted contacts when exploring
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                Avoid carrying large amounts of cash in high-risk areas
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                Trust your instincts - if something feels wrong, leave the area
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
