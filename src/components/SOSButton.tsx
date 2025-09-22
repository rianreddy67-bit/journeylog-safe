import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const SOSButton = () => {
  const { toast } = useToast();
  const [isPressed, setIsPressed] = useState(false);

  const handleSOSPress = () => {
    setIsPressed(true);
    
    // Simulate emergency services call
    toast({
      title: "🚨 SOS Alert Sent!",
      description: "Emergency contacts notified. Location shared.",
      variant: "destructive",
    });

    // Mock location sharing
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        console.log("Emergency location:", { latitude, longitude });
        
        toast({
          title: "📍 Location Shared",
          description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        });
      });
    }

    setTimeout(() => setIsPressed(false), 3000);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <Button
        onClick={handleSOSPress}
        variant="destructive"
        size="lg"
        className={cn(
          "h-16 w-16 rounded-full shadow-sos",
          "bg-destructive hover:bg-destructive/90",
          "transition-all duration-300",
          isPressed && "scale-110 shadow-xl"
        )}
      >
        {isPressed ? (
          <Phone className="h-8 w-8 animate-pulse" />
        ) : (
          <AlertTriangle className="h-8 w-8" />
        )}
      </Button>
    </div>
  );
};

function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}