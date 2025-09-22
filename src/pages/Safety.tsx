import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Phone, Shield, Users, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const riskZones = [
  { name: "Downtown Market Area", risk: "Medium", reason: "Crowded area, pickpocketing reports" },
  { name: "Old City Bridge", risk: "High", reason: "Recent security incidents" },
  { name: "Riverside Park", risk: "Low", reason: "Well-patrolled area" },
];

const emergencyContacts = [
  { name: "Local Police", number: "100", icon: Shield },
  { name: "Ambulance", number: "108", icon: Phone },
  { name: "Tourist Helpline", number: "1363", icon: Users },
];

export default function Safety() {
  const [currentLocation, setCurrentLocation] = useState("Fetching location...");
  const [nearbyRisk, setNearbyRisk] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate location tracking
    setTimeout(() => {
      setCurrentLocation("Connaught Place, New Delhi");
      setNearbyRisk("Medium");
      
      toast({
        title: "⚠️ Area Alert",
        description: "You're entering a medium-risk zone. Stay alert!",
        variant: "destructive",
      });
    }, 2000);
  }, [toast]);

  const handleEmergencyCall = (number: string, name: string) => {
    toast({
      title: `📞 Calling ${name}`,
      description: `Dialing ${number}...`,
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Safety Center</h1>
          <p className="text-muted-foreground">Your safety is our priority</p>
        </div>

        {/* Current Location & Risk Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentLocation}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Updated 2 minutes ago
                </p>
              </div>
              {nearbyRisk && (
                <Badge 
                  variant={nearbyRisk === "High" ? "destructive" : nearbyRisk === "Medium" ? "secondary" : "default"}
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {nearbyRisk} Risk
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

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

        {/* Emergency Contacts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
            <CardDescription>Quick access to help</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {emergencyContacts.map((contact, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-between h-auto p-4"
                  onClick={() => handleEmergencyCall(contact.number, contact.name)}
                >
                  <div className="flex items-center gap-3">
                    <contact.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{contact.name}</span>
                  </div>
                  <span className="text-muted-foreground">{contact.number}</span>
                </Button>
              ))}
            </div>
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