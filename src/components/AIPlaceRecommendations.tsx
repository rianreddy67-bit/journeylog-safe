import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const interestOptions = [
  "Culture & History",
  "Food & Dining",
  "Nature & Outdoors",
  "Adventure",
  "Shopping",
  "Nightlife",
  "Art & Museums",
  "Beach & Water",
  "Local Markets"
];

const tripTypes = ["Solo", "Family", "Couple", "Friends", "Business"];
const budgetLevels = ["Budget", "Moderate", "Luxury"];

export function AIPlaceRecommendations() {
  const [destination, setDestination] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [tripType, setTripType] = useState("");
  const [budget, setBudget] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const getRecommendations = async () => {
    if (!destination.trim()) {
      toast({
        title: "Destination Required",
        description: "Please enter a destination to get recommendations",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-place-recommendations', {
        body: {
          destination: destination.trim(),
          interests: selectedInterests,
          tripType,
          budget,
        }
      });

      if (error) throw error;

      if (data.success) {
        setRecommendations(data.recommendations);
        toast({
          title: "✨ Recommendations Ready",
          description: `Generated personalized suggestions for ${destination}`,
        });
      } else {
        throw new Error(data.error || "Failed to generate recommendations");
      }
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Place Recommendations
        </CardTitle>
        <CardDescription>
          Get personalized travel suggestions powered by AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Destination Input */}
        <div className="space-y-2">
          <Label htmlFor="destination">
            <MapPin className="h-4 w-4 inline mr-1" />
            Destination
          </Label>
          <Input
            id="destination"
            placeholder="e.g., Paris, Tokyo, New York..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <Label>Interests (Optional)</Label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => !loading && toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        {/* Trip Type */}
        <div className="space-y-2">
          <Label>Trip Type (Optional)</Label>
          <div className="flex flex-wrap gap-2">
            {tripTypes.map((type) => (
              <Badge
                key={type}
                variant={tripType === type ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => !loading && setTripType(type === tripType ? "" : type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label>Budget Level (Optional)</Label>
          <div className="flex flex-wrap gap-2">
            {budgetLevels.map((level) => (
              <Badge
                key={level}
                variant={budget === level ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => !loading && setBudget(level === budget ? "" : level)}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={getRecommendations}
          disabled={loading || !destination.trim()}
          className="w-full"
          variant="gradient"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Recommendations...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get AI Recommendations
            </>
          )}
        </Button>

        {/* Recommendations Display */}
        {recommendations && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Your Personalized Recommendations
            </h4>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {recommendations}
              </pre>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            💡 Powered by Gemini AI
          </p>
          <p className="text-blue-700 dark:text-blue-200 mt-1">
            Get personalized suggestions based on your preferences. All Gemini models are free to use until October 6, 2025!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
