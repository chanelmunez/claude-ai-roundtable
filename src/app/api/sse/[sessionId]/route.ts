import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      const data = `data: ${JSON.stringify({
        type: 'connection',
        sessionId,
        timestamp: Date.now(),
        message: 'Connected to roundtable session'
      })}\n\n`;
      
      controller.enqueue(encoder.encode(data));

      // Set up interval to send keep-alive messages
      const keepAliveInterval = setInterval(() => {
        try {
          const keepAlive = `data: ${JSON.stringify({
            type: 'keep-alive',
            timestamp: Date.now()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(keepAlive));
        } catch (error) {
          console.error('Keep-alive error:', error);
          clearInterval(keepAliveInterval);
          controller.close();
        }
      }, 30000); // 30 seconds

      // Clean up on close
      request.signal?.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Utility function to send SSE events (would be used by other parts of the app)
export function sendSSEEvent(sessionId: string, eventType: string, data: unknown) {
  // In a real implementation, you'd maintain active connections
  // and broadcast to all clients connected to this session
  const event = {
    type: eventType,
    sessionId,
    data,
    timestamp: Date.now()
  };
  
  console.log('SSE Event:', event);
  return event;
}