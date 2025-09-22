import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock, Star, Camera, Navigation } from "lucide-react";
import { useState } from "react";

const sampleItinerary = [
  {
    day: 1,
    date: "Dec 25, 2024",
    title: "Arrival in Delhi",
    activities: [
      { time: "10:00", title: "Airport Pickup", location: "IGI Airport", type: "transport" },
      { time: "12:00", title: "Check-in & Lunch", location: "Hotel Imperial", type: "accommodation" },
      { time: "15:00", title: "Red Fort Visit", location: "Red Fort, Old Delhi", type: "sightseeing" },
      { time: "18:00", title: "Chandni Chowk Food Tour", location: "Chandni Chowk", type: "food" },
    ]
  },
  {
    day: 2,
    date: "Dec 26, 2024", 
    title: "Delhi Sightseeing",
    activities: [
      { time: "09:00", title: "India Gate", location: "Rajpath", type: "sightseeing" },
      { time: "11:00", title: "Lotus Temple", location: "Bahapur", type: "sightseeing" },
      { time: "14:00", title: "Qutub Minar", location: "Mehrauli", type: "sightseeing" },
      { time: "17:00", title: "Connaught Place Shopping", location: "CP", type: "shopping" },
    ]
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'transport': return Navigation;
    case 'accommodation': return MapPin;
    case 'sightseeing': return Camera;
    case 'food': return Star;
    case 'shopping': return MapPin;
    default: return Clock;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'transport': return 'bg-blue-100 text-blue-700';
    case 'accommodation': return 'bg-green-100 text-green-700';
    case 'sightseeing': return 'bg-purple-100 text-purple-700';
    case 'food': return 'bg-orange-100 text-orange-700';
    case 'shopping': return 'bg-pink-100 text-pink-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function Itinerary() {
  const [selectedDay, setSelectedDay] = useState(1);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">My Itinerary</h1>
          <p className="text-muted-foreground">Golden Triangle Tour • 5 Days</p>
        </div>

        {/* Trip Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Trip Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-sm text-muted-foreground">Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Activities</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">3</p>
                <p className="text-sm text-muted-foreground">Cities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sampleItinerary.map((day) => (
            <Button
              key={day.day}
              variant={selectedDay === day.day ? "default" : "outline"}
              className="flex-shrink-0"
              onClick={() => setSelectedDay(day.day)}
            >
              Day {day.day}
            </Button>
          ))}
          <Button variant="outline" className="flex-shrink-0">
            + Day 3
          </Button>
        </div>

        {/* Selected Day Itinerary */}
        {sampleItinerary.map((day) => 
          selectedDay === day.day && (
            <Card key={day.day} className="shadow-card">
              <CardHeader>
                <CardTitle>Day {day.day} - {day.title}</CardTitle>
                <CardDescription>{day.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {day.activities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {index < day.activities.length - 1 && (
                            <div className="w-px h-8 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{activity.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {activity.time}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.location}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
            <Navigation className="h-6 w-6" />
            <span className="text-sm">Navigate</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
            <Camera className="h-6 w-6" />
            <span className="text-sm">Add Photos</span>
          </Button>
        </div>

        {/* Offline Status */}
        <Card className="shadow-card border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium">Itinerary saved offline</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Available even without internet connection
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}