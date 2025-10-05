import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import { WeatherCard } from "@/components/WeatherCard";
import { ExpenseTracker } from "@/components/ExpenseTracker";
import { ReviewRating } from "@/components/ReviewRating";
import { AIPlaceRecommendations } from "@/components/AIPlaceRecommendations";
import heroImage from "@/assets/hero-travel.jpg";
import goldenTriangleImage from "@/assets/golden-triangle.jpg";
import keralaBackwatersImage from "@/assets/kerala-backwaters.jpg";
import himalayanAdventureImage from "@/assets/himalayan-adventure.jpg";

const mockRecommendations = [
  {
    id: 1,
    title: "Golden Triangle Tour",
    location: "Delhi • Agra • Jaipur",
    duration: "5 days",
    budget: "₹15,000",
    rating: 4.8,
    image: goldenTriangleImage,
    description: "Experience India's most iconic monuments including the Taj Mahal",
  },
  {
    id: 2,
    title: "Kerala Backwaters",
    location: "Alleppey • Kumarakom",
    duration: "3 days", 
    budget: "₹12,000",
    rating: 4.9,
    image: keralaBackwatersImage,
    description: "Serene houseboat experience through palm-fringed waterways",
  },
  {
    id: 3,
    title: "Himalayan Adventure",
    location: "Manali • Spiti Valley",
    duration: "7 days",
    budget: "₹25,000", 
    rating: 4.7,
    image: himalayanAdventureImage,
    description: "High-altitude adventure through stunning mountain landscapes",
  },
];

export default function Home() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "expenses" | "reviews" | "ai">("plan");

  const handleSearch = () => {
    setShowRecommendations(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src={heroImage} 
            alt="Indian Travel Destinations" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Welcome to TourSafe</h1>
            <p className="text-lg opacity-90">Discover India safely with AI-powered recommendations</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="px-6 space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Plan Your Journey
              </CardTitle>
              <CardDescription>Tell us your preferences and we'll create the perfect itinerary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Where would you like to go?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <Input
                placeholder="What's your budget? (₹)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <Button 
                onClick={handleSearch}
                className="w-full"
                variant="gradient"
                size="lg"
              >
                Get AI Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Features Tabs */}
        <div className="px-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab("plan")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "plan" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              🗺️ Plan
            </button>
            <button 
              onClick={() => setActiveTab("ai")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "ai" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              ✨ AI
            </button>
            <button 
              onClick={() => setActiveTab("expenses")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "expenses" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              💰 Expenses
            </button>
            <button 
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "reviews" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              ⭐ Reviews
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6">
          {activeTab === "plan" && (
            <div className="space-y-6">
              <WeatherCard location={destination || "Delhi"} />
            </div>
          )}
          
          {activeTab === "ai" && <AIPlaceRecommendations />}
          
          {activeTab === "expenses" && <ExpenseTracker />}
          
          {activeTab === "reviews" && <ReviewRating />}
        </div>

        {/* Recommendations */}
        {showRecommendations && (
          <div className="px-6 space-y-4">
            <h2 className="text-2xl font-semibold">Recommended for You</h2>
            <div className="space-y-4">
              {mockRecommendations.map((rec) => (
                <Card key={rec.id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img 
                        src={rec.image} 
                        alt={rec.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{rec.title}</h3>
                          <p className="text-muted-foreground">{rec.location}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{rec.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {rec.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {rec.budget}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}