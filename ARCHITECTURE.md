# Revolt Voice Assistant - Server-to-Server Architecture

## 🏗️ Architecture Overview

This application implements a **true server-to-server architecture** with the following components:

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐    Gemini API    ┌─────────────────┐
│   Client (UI)   │ ◄─────────────────► │  Express Server │ ◄──────────────► │  Google Gemini  │
│  (Browser)      │                     │  (Node.js)      │                  │  (External)     │
└─────────────────┘                     └─────────────────┘                  └─────────────────┘
         │                                       │
         │ WebSocket (Optional)                  │
         │ (Backward Compatibility)              │
         └───────────────────────────────────────┘
```

## 🔄 Server-to-Server Communication Flow

### 1. **Primary Communication: REST API**
- **Client** ↔ **Server**: HTTP REST endpoints
- **Server** ↔ **Gemini**: Direct API calls
- **No direct client-to-Gemini communication**

### 2. **Secondary Communication: WebSocket (Optional)**
- **Client** ↔ **Server**: WebSocket for real-time updates
- **Server acts as proxy** to REST API endpoints
- **Backward compatibility only**

## 📡 API Endpoints

### **Core REST API Endpoints**

#### `POST /api/chat/start`
- **Purpose**: Initialize a new chat session
- **Request**: `{}`
- **Response**: 
```json
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "model": "gemini-1.5-flash",
  "isFallback": false,
  "message": "Chat session started successfully"
}
```

#### `POST /api/chat/message`
- **Purpose**: Send message to AI and get response
- **Request**:
```json
{
  "sessionId": "session_1234567890_abc123",
  "message": "Hello, how can you help me?",
  "messageType": "voice"
}
```
- **Response**:
```json
{
  "success": true,
  "response": "Hello! I'm Rev, your Revolt Motors AI assistant...",
  "messageType": "voice",
  "model": "gemini-1.5-flash",
  "isFallback": false,
  "responseTime": 1250
}
```

#### `DELETE /api/chat/session/:sessionId`
- **Purpose**: End a chat session
- **Response**:
```json
{
  "success": true,
  "message": "Session ended successfully"
}
```

### **Health & Monitoring Endpoints**

#### `GET /health`
- **Purpose**: Server health check
- **Response**:
```json
{
  "status": "healthy",
  "activeConnections": 5,
  "activeSessions": 3,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

#### `GET /api/status`
- **Purpose**: API status and configuration
- **Response**:
```json
{
  "status": "running",
  "model": "gemini-1.5-flash",
  "fallback": "gemini-1.5-pro",
  "activeConnections": 5,
  "activeSessions": 3
}
```

## 🔧 Server-Side Implementation

### **Session Management**
```javascript
// Server maintains session state
const chatSessions = new Map();

// Each session contains:
{
  chatSession: GeminiChatSession,
  modelUsed: 'gemini-1.5-flash',
  isFallback: false,
  createdAt: Date,
  lastActivity: Date,
  messageCount: 0
}
```

### **AI Model Integration**
```javascript
// Server directly communicates with Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 150,
    temperature: 0.7
  }
});
```

### **Error Handling & Fallbacks**
```javascript
// Primary model fails → Fallback model
try {
  // Use gemini-1.5-flash
} catch (error) {
  // Fallback to gemini-1.5-pro
}
```

## 🌐 Client-Side Implementation

### **REST API Communication**
```javascript
// Client uses fetch() for all server communication
const API_BASE_URL = 'http://localhost:3000/api';

async function sendMessage(message, messageType = 'voice') {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      message: message,
      messageType: messageType
    })
  });
  return response.json();
}
```

### **Voice Processing**
```javascript
// Client handles voice input/output locally
// Server only receives text messages
recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  const result = await sendMessage(transcript, 'voice');
  // Handle AI response with speech synthesis
};
```

## 🔒 Security & Privacy

### **API Key Protection**
- **Server-side only**: API keys never exposed to client
- **Environment variables**: Secure key management
- **No client-to-Gemini**: All requests go through server

### **Session Security**
- **Unique session IDs**: Generated server-side
- **Session expiration**: Automatic cleanup after 1 hour
- **Input validation**: Server validates all requests

## 📊 Performance Optimizations

### **Response Optimization**
- **Shorter responses**: 150 token limit for faster interaction
- **Response time tracking**: Monitor latency
- **Context-aware prompts**: Optimize based on conversation flow

### **Session Management**
- **Memory efficient**: Clean up expired sessions
- **Connection pooling**: Reuse connections
- **Error recovery**: Graceful fallbacks

## 🔄 WebSocket Integration (Optional)

### **Backward Compatibility**
```javascript
// WebSocket acts as proxy to REST API
wss.on('message', async (message) => {
  if (data.type === 'startSession') {
    // Proxy to /api/chat/start
    const response = await fetch(`http://localhost:${PORT}/api/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: data.sessionId })
    });
    // Send result back via WebSocket
  }
});
```

## 🚀 Deployment Architecture

### **Production Setup**
```
┌─────────────────┐    HTTPS/SSL    ┌─────────────────┐    HTTPS    ┌─────────────────┐
│   Client (UI)   │ ◄─────────────► │  Load Balancer  │ ◄─────────► │  Express Server │
│  (CDN/Static)   │                 │  (Nginx/AWS)    │             │  (Node.js)      │
└─────────────────┘                 └─────────────────┘             └─────────────────┘
                                                                              │
                                                                              │ HTTPS
                                                                              ▼
                                                                     ┌─────────────────┐
                                                                     │  Google Gemini  │
                                                                     │  (External API) │
                                                                     └─────────────────┘
```

### **Scalability Features**
- **Stateless sessions**: Can scale horizontally
- **Load balancing**: Multiple server instances
- **Health checks**: Automatic failover
- **Graceful shutdown**: Clean session cleanup

## ✅ Architecture Benefits

### **Security**
- ✅ API keys protected server-side
- ✅ No direct client-to-external API communication
- ✅ Input validation and sanitization
- ✅ Session-based security

### **Performance**
- ✅ Optimized response times
- ✅ Efficient session management
- ✅ Connection pooling
- ✅ Error recovery and fallbacks

### **Maintainability**
- ✅ Clear separation of concerns
- ✅ RESTful API design
- ✅ Comprehensive error handling
- ✅ Health monitoring

### **Scalability**
- ✅ Horizontal scaling support
- ✅ Stateless session management
- ✅ Load balancer ready
- ✅ Graceful degradation

## 🔍 Testing the Architecture

### **API Testing**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test session creation
curl -X POST http://localhost:3000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{}'

# Test message sending
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session_123","message":"Hello","messageType":"voice"}'
```

### **Load Testing**
```bash
# Test with multiple concurrent sessions
npm run test-api
```

This architecture ensures **true server-to-server communication** with the client acting only as a UI layer, while all AI processing and external API communication happens securely on the server side.
