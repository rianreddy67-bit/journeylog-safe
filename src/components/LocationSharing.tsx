import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Users, Share2, MapPin, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SharedLocation {
  id: string;
  shared_with_email: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export function LocationSharing() {
  const [isSharing, setIsSharing] = useState(false);
  const [sharedWith, setSharedWith] = useState<SharedLocation[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [shareForHours, setShareForHours] = useState(24);
  const { toast } = useToast();

  // Load sharing settings
  useEffect(() => {
    loadSharingSettings();
  }, []);

  const loadSharingSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('location_shares')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setSharedWith(data || []);
      setIsSharing(data && data.length > 0);
    } catch (error) {
      console.error('Error loading sharing settings:', error);
    }
  };

  const shareLocation = async () => {
    if (!newEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to share with",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + shareForHours);

      const { error } = await supabase
        .from('location_shares')
        .insert({
          user_id: user.id,
          shared_with_email: newEmail,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "✅ Location Shared",
        description: `Sharing location with ${newEmail} for ${shareForHours} hours`,
      });

      setNewEmail("");
      loadSharingSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const revokeAccess = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('location_shares')
        .update({ is_active: false })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Access Revoked",
        description: "Location sharing stopped",
      });

      loadSharingSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const timeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const hours = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60));
      return `${minutes}m remaining`;
    }
    return `${hours}h remaining`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Location Sharing
          </div>
          <Badge variant={isSharing ? "default" : "secondary"}>
            {isSharing ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>Share your live location with trusted contacts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Share */}
        <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="Contact email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={168}
              value={shareForHours}
              onChange={(e) => setShareForHours(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">hours</span>
          </div>
          <Button onClick={shareLocation} variant="gradient" size="sm" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Share Location
          </Button>
        </div>

        {/* Active Shares */}
        {sharedWith.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Shared With</h4>
            {sharedWith.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{share.shared_with_email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeRemaining(share.expires_at)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => revokeAccess(share.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-100">
              <p className="font-medium">Privacy Protected</p>
              <p className="text-blue-700 dark:text-blue-200 mt-1">
                Location sharing expires automatically. You can revoke access anytime.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
