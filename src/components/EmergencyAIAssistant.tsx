import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, encodeAudioForAPI, playAudioData } from "@/utils/RealtimeAudio";

export const EmergencyAIAssistant = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startCall = async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke('realtime-emergency');
      
      if (error) throw error;
      if (!data?.client_secret?.value) throw new Error("Failed to get session token");

      const ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, [
        'realtime',
        `openai-insecure-api-key.${data.client_secret.value}`,
        'openai-beta.realtime-v1'
      ]);

      wsRef.current = ws;
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Received:', message.type);

        if (message.type === 'session.created') {
          ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: `You are an emergency AI assistant for TourSafe. Provide calm, clear guidance during emergencies. Help users communicate, offer translation, and provide first aid instructions when appropriate. Always be reassuring and action-oriented.`,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: { model: 'whisper-1' },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8
            }
          }));
        }

        if (message.type === 'session.updated') {
          setIsConnected(true);
          setIsConnecting(false);
          
          recorderRef.current = new AudioRecorder((audioData) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: encodeAudioForAPI(audioData)
              }));
            }
          });
          await recorderRef.current.start();

          toast({
            title: "Connected",
            description: "Emergency AI assistant is ready to help",
          });
        }

        if (message.type === 'response.audio.delta' && message.delta && audioContextRef.current) {
          const binaryString = atob(message.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await playAudioData(audioContextRef.current, bytes);
          setIsSpeaking(true);
        }

        if (message.type === 'response.audio.done') {
          setIsSpeaking(false);
        }

        if (message.type === 'error') {
          console.error('OpenAI error:', message);
          toast({
            title: "Error",
            description: message.error?.message || "An error occurred",
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        endCall();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        endCall();
      };

    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start emergency call",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    recorderRef.current?.stop();
    wsRef.current?.close();
    audioContextRef.current?.close();
    
    recorderRef.current = null;
    wsRef.current = null;
    audioContextRef.current = null;
    
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-destructive" />
          AI Emergency Assistant
        </CardTitle>
        <CardDescription>
          Real-time voice support for emergency situations with translation and guidance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && !isConnecting && (
          <Button 
            onClick={startCall}
            className="w-full bg-destructive hover:bg-destructive/90"
            size="lg"
          >
            <Phone className="mr-2 h-5 w-5" />
            Start Emergency Call
          </Button>
        )}

        {isConnecting && (
          <Button disabled className="w-full" size="lg">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </Button>
        )}

        {isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 p-4 bg-destructive/10 rounded-lg">
              <div className={`h-4 w-4 rounded-full ${isSpeaking ? 'bg-destructive animate-pulse' : 'bg-muted'}`} />
              <span className="text-sm font-medium">
                {isSpeaking ? 'AI is speaking...' : 'Listening...'}
              </span>
            </div>
            <Button 
              onClick={endCall}
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
              size="lg"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              End Call
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>The AI assistant can:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Guide you through emergency procedures</li>
            <li>Help communicate with local emergency services</li>
            <li>Provide translation assistance</li>
            <li>Offer first aid instructions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
