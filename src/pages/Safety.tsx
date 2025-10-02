import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, MapPin, Phone, AlertTriangle, Users, Clock, Plus, Trash2, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { LocationTracker } from "@/components/LocationTracker";

const riskZones = [
  { name: "Downtown Market Area", risk: "Medium", reason: "Crowded area, pickpocketing reports" },
  { name: "Old City Bridge", risk: "High", reason: "Recent security incidents" },
  { name: "Riverside Park", risk: "Low", reason: "Well-patrolled area" },
];

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function Safety() {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  // Load emergency contacts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tourSafeEmergencyContacts');
    if (saved) {
      setEmergencyContacts(JSON.parse(saved));
    } else {
      // Add default emergency contacts
      const defaultContacts = [
        { id: "1", name: "Police", phone: "100", relationship: "Emergency Service" },
        { id: "2", name: "Fire Department", phone: "101", relationship: "Emergency Service" },
        { id: "3", name: "Ambulance", phone: "102", relationship: "Emergency Service" }
      ];
      setEmergencyContacts(defaultContacts);
    }
  }, []);

  // Save emergency contacts to localStorage
  useEffect(() => {
    localStorage.setItem('tourSafeEmergencyContacts', JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and phone number",
        variant: "destructive"
      });
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      ...newContact
    };

    setEmergencyContacts(prev => [...prev, contact]);
    setNewContact({ name: "", phone: "", relationship: "" });
    setShowAddForm(false);
    
    toast({
      title: "📞 Contact Added",
      description: `${newContact.name} added to emergency contacts`,
    });
  };

  const deleteContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== id));
    toast({
      title: "🗑️ Contact Removed",
      description: "Emergency contact deleted",
    });
  };

  const callContact = (name: string, phone: string) => {
    toast({
      title: "📞 Calling",
      description: `Calling ${name} at ${phone}`,
    });
    // In a real app, this would trigger a phone call
    if (navigator.userAgent.includes('Mobile')) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Safety Center</h1>
          <p className="text-muted-foreground">Your safety is our priority</p>
        </div>

        {/* Location Tracking */}
        <LocationTracker />

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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Emergency Contacts
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </CardTitle>
            <CardDescription>Quick access to emergency numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Contact Form */}
            {showAddForm && (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                <Input
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Phone number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  placeholder="Relationship (e.g., Family, Friend)"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button onClick={addEmergencyContact} size="sm" variant="gradient">
                    Save Contact
                  </Button>
                  <Button onClick={() => setShowAddForm(false)} size="sm" variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Contact List */}
            <div className="grid grid-cols-1 gap-3">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                  <div className="flex-1" onClick={() => callContact(contact.name, contact.phone)}>
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-sm text-primary font-medium">{contact.phone}</p>
                    {contact.relationship && (
                      <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => callContact(contact.name, contact.phone)}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    {!["100", "101", "102", "1363"].includes(contact.phone) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteContact(contact.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
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