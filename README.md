# 🎤 Revolt Voice Assistant

A real-time voice assistant powered by Google Gemini AI with multi-language support, built with Node.js and Web Speech API.

## ✨ Features

- **🎤 Real-time Voice Interaction**: Speak naturally and get AI responses
- **🌍 Multi-language Support**: English, Spanish, French, German, Hindi, Chinese, Japanese, Korean
- **🤖 Google Gemini AI**: Powered by the latest Gemini 2.0 models
- **🔊 Voice Synthesis**: AI responses are spoken back to you
- **⚡ Real-time Processing**: Low-latency voice recognition and response
- **🎨 Modern UI**: Clean, responsive web interface
- **🔧 Easy Setup**: One-command installation and configuration

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Google Gemini API Key** (free tier available)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd revolt-voice
   npm install
   ```

2. **Setup API Key**
   ```bash
   npm run setup
   ```
   Follow the prompts to add your Gemini API key.

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Open in Browser**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

### AI Models

The application automatically selects the best available Gemini model:

- **Primary**: `gemini-2.0-flash-001` (fast, efficient)
- **Fallback**: `gemini-2.0-flash-exp` (experimental, high-quality)

### Environment-Based Configuration

```bash
# Production (default)
npm start

# Development
npm run dev:development

# Testing
npm run dev:testing
```

## 🎯 Usage

### Basic Voice Interaction

1. **Click "Start Listening"** or press the microphone button
2. **Speak your message** in any supported language
3. **Wait for AI response** - it will be spoken back to you
4. **Continue the conversation** naturally

### Supported Languages

| Language | Code | Example |
|----------|------|---------|
| English | `en` | "Hello, how are you?" |
| Spanish | `es` | "¡Hola! ¿Cómo estás?" |
| French | `fr` | "Bonjour! Comment allez-vous?" |
| German | `de` | "Hallo! Wie geht es dir?" |
| Hindi | `hi` | "नमस्ते! कैसे हो आप?" |
| Chinese | `zh` | "你好！你好吗？" |
| Japanese | `ja` | "こんにちは！お元気ですか？" |
| Korean | `ko` | "안녕하세요! 어떻게 지내세요?" |

### Voice Controls

- **🎤 Test Voice**: Click to test your audio system
- **🎵 Voice Quality**: Toggle between standard and high-quality voice settings
- **🔍 Diagnostics**: Check system status and capabilities

## 🛠️ Development

### Project Structure

```
revolt-voice/
├── public/                 # Frontend files
│   ├── index.html         # Main UI
│   ├── client.js          # Voice interaction logic
│   ├── diagnostic.js      # System diagnostics
│   └── error-handler.js   # Error handling
├── server.js              # Backend server
├── config.js              # AI model configuration
├── setup.js               # Initial setup script
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Available Scripts

```bash
# Start the application
npm start

# Setup API key and environment
npm run setup

# Development mode
npm run dev:development

# Testing mode
npm run dev:testing

# Test AI models
npm run test-models

# Test language support
npm run test-language

# List available models
node list-models.js
```

### API Endpoints

- `GET /` - Main application interface
- `GET /health` - Server health check
- `POST /api/chat/start` - Start new chat session
- `POST /api/chat/message` - Send message to AI
- `GET /api/status` - Server status and diagnostics

## 🔍 Troubleshooting

### Common Issues

#### 1. **"API Key Not Found" Error**
```bash
# Solution: Run setup
npm run setup
```
Make sure your `.env` file contains:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

#### 2. **"Model Not Found" Error**
```bash
# Solution: Test available models
npm run test-models
```
The app automatically falls back to working models.

#### 3. **"Rate Limit Exceeded" Error**
- **Cause**: API quota exceeded
- **Solution**: Wait a few minutes or upgrade your Gemini API plan
- **Prevention**: The app automatically retries with fallback models

#### 4. **Voice Not Working**
```bash
# Check browser compatibility
# Test voice in browser console:
speechSynthesis.getVoices()
```
- **Chrome**: Best support
- **Firefox**: Good support
- **Safari**: Limited support
- **Edge**: Good support

#### 5. **Server Won't Start**
```bash
# Check if port 3000 is available
lsof -i :3000
# Kill process if needed
kill -9 <PID>
```

#### 6. **Poor Voice Quality**
- **Enable High Quality**: Click the "🎵 High Quality" button
- **Check Browser**: Use Chrome for best voice quality
- **Test Voice**: Use the test button to verify audio

### Diagnostic Tools

#### Client-Side Diagnostics
Open browser console and run:
```javascript
// Check voice capabilities
window.debugAllVoices()

// Check server status
fetch('/health').then(r => r.json()).then(console.log)
```

#### Server-Side Diagnostics
```bash
# Test models
npm run test-models

# Test language support
npm run test-language

# Check server health
curl http://localhost:3000/health
```

## 🔒 Security

### API Key Management
- **Never commit API keys** to version control
- **Use environment variables** for sensitive data
- **Rotate keys regularly** for production use

### Rate Limiting
- **Free tier limits**: 15 requests per minute
- **Automatic fallback**: Uses alternative models when limits exceeded
- **User feedback**: Clear messages when limits are reached

## 📊 Performance

### Optimization Features
- **Connection pooling**: Efficient API request handling
- **Voice caching**: Optimized voice selection
- **Error recovery**: Automatic retry mechanisms
- **Memory management**: Efficient resource usage

### Browser Compatibility
- **Chrome**: Full support, best performance
- **Firefox**: Full support, good performance
- **Safari**: Limited support, basic functionality
- **Edge**: Full support, good performance

## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev:development

# Run tests
npm run test-models
npm run test-language
```

### Code Style
- **JavaScript**: ES6+ features
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Structured console logging
- **Comments**: Clear, descriptive comments

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for providing the AI capabilities
- **Web Speech API** for voice recognition and synthesis
- **Node.js Community** for the excellent ecosystem
- **Open Source Contributors** for various dependencies

## 📞 Support

### Getting Help
1. **Check Troubleshooting** section above
2. **Run Diagnostics** using provided tools
3. **Check Browser Console** for error messages
4. **Test Models** using `npm run test-models`

### Reporting Issues
When reporting issues, please include:
- **Browser and version**
- **Node.js version**
- **Error messages**
- **Steps to reproduce**
- **Diagnostic output**

---

**🎉 Enjoy your voice assistant!** 

Start speaking and let the AI help you with anything you need! 🚀
