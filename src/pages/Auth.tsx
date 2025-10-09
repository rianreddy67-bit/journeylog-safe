import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [digitalIdGenerated, setDigitalIdGenerated] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Welcome back!",
        description: "Login successful.",
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: registerData.firstName,
          last_name: registerData.lastName,
          phone: registerData.phone,
        }
      }
    });

    if (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDigitalIdGenerated(true);
      toast({
        title: "🎉 Registration Successful!",
        description: "Please check your email to verify your account.",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">TourSafe</h1>
          </div>
          <p className="text-lg text-white/90 max-w-md">
            Your trusted companion for safe and secure travel experiences around the world
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg mt-1">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Digital Identity</h3>
              <p className="text-white/80 text-sm">Secure verification with unique digital ID</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg mt-1">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Travel Safe</h3>
              <p className="text-white/80 text-sm">Emergency assistance and real-time safety features</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">TourSafe</h1>
            </div>
            <p className="text-muted-foreground text-sm">Secure travel planning</p>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome</h2>
            <p className="text-muted-foreground">Sign in to your account or create a new one</p>
          </div>

          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email"
                    placeholder="name@example.com" 
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </div>

              <Button 
                onClick={handleLogin} 
                className="w-full h-11 bg-primary hover:bg-primary-hover font-medium" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="name@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number <span className="text-muted-foreground">(Optional)</span></Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 9876543210"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-medium">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-11"
                  />
                </div>
                
                {/* Government ID Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Government ID <span className="text-muted-foreground">(Optional)</span></Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload Aadhaar, PAN, or Passport
                    </p>
                    <Button variant="outline" size="sm" type="button">
                      Choose File
                    </Button>
                  </div>
                </div>

                {digitalIdGenerated && (
                  <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                    <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Digital ID Generated</p>
                      <Badge variant="outline" className="text-xs mt-1 font-mono">
                        TS{Math.random().toString(36).substr(2, 9).toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleRegister} 
                className="w-full h-11 bg-primary hover:bg-primary-hover font-medium" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}