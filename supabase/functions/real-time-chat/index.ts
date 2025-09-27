import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active connections
const connections = new Map<string, WebSocket>();
const userSockets = new Map<string, string>(); // userId -> socketId
const chatRooms = new Map<string, Set<string>>(); // roomId -> Set of userIds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle WebSocket upgrade for real-time chat
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    const socketId = crypto.randomUUID();
    connections.set(socketId, socket);

    socket.onopen = () => {
      console.log(`WebSocket connected: ${socketId}`);
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await handleWebSocketMessage(socketId, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    };

    socket.onclose = () => {
      console.log(`WebSocket disconnected: ${socketId}`);
      handleDisconnection(socketId);
      connections.delete(socketId);
    };

    return response;
  }

  // Handle HTTP requests for chat history and room management
  try {
    const { action, roomId, userId, message, limit = 50 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'get_history') {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          messages: data.reverse(),
          roomId 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'create_room') {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          id: roomId,
          name: `Travel Group ${roomId.slice(0, 8)}`,
          created_by: userId,
          trip_id: req.json().tripId || null
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ room: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'join_room') {
      // Add user to room
      if (!chatRooms.has(roomId)) {
        chatRooms.set(roomId, new Set());
      }
      chatRooms.get(roomId)?.add(userId);

      // Broadcast join notification
      broadcastToRoom(roomId, {
        type: 'user_joined',
        userId,
        roomId,
        timestamp: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({ success: true, roomId, userId }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in real-time chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleWebSocketMessage(socketId: string, data: any) {
  const { type, userId, roomId, message, messageId } = data;

  if (type === 'join') {
    userSockets.set(userId, socketId);
    if (!chatRooms.has(roomId)) {
      chatRooms.set(roomId, new Set());
    }
    chatRooms.get(roomId)?.add(userId);
    
    // Send confirmation
    const socket = connections.get(socketId);
    socket?.send(JSON.stringify({
      type: 'joined',
      roomId,
      userId
    }));
  }

  else if (type === 'message') {
    // Save message to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        id: messageId,
        room_id: roomId,
        user_id: userId,
        message,
        message_type: 'text'
      })
      .select()
      .single();

    if (!error) {
      // Broadcast to all users in room
      broadcastToRoom(roomId, {
        type: 'new_message',
        message: data,
        roomId
      });
    }
  }

  else if (type === 'typing') {
    // Broadcast typing indicator
    broadcastToRoom(roomId, {
      type: 'typing',
      userId,
      roomId,
      isTyping: data.isTyping
    }, userId); // Exclude sender
  }
}

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  const roomUsers = chatRooms.get(roomId);
  if (!roomUsers) return;

  roomUsers.forEach(userId => {
    if (excludeUserId && userId === excludeUserId) return;
    
    const socketId = userSockets.get(userId);
    if (socketId) {
      const socket = connections.get(socketId);
      socket?.send(JSON.stringify(message));
    }
  });
}

function handleDisconnection(socketId: string) {
  // Find and remove user from tracking
  for (const [userId, userSocketId] of userSockets.entries()) {
    if (userSocketId === socketId) {
      userSockets.delete(userId);
      
      // Remove from all chat rooms
      for (const [roomId, users] of chatRooms.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          // Broadcast user left
          broadcastToRoom(roomId, {
            type: 'user_left',
            userId,
            roomId,
            timestamp: new Date().toISOString()
          });
        }
      }
      break;
    }
  }
}