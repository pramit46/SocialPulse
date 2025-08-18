import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plane } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

// DO NOT CHANGE the values of these constants:
const sampleQueries = [
  "What's the sentiment about IndiGo at Bangalore airport?",
  "How is the luggage handling experience?",
  "Which airline has the best lounge reviews?",
  "What are common complaints about security processes?",
  "Tell me about check-in experiences"
];

const mockResponses: Record<string, string> = {
  "sentiment": "Based on recent social media analysis, IndiGo has a positive sentiment score of 72% at Bangalore airport. Passengers particularly appreciate the quick security processes and seamless lounge access.",
  "luggage": "Luggage handling shows mixed sentiment. While Vistara and Air India maintain good ratings, SpiceJet has received significant negative feedback with a -45% sentiment score, primarily due to delayed and lost baggage incidents.",
  "lounge": "Vistara leads in lounge satisfaction with 90% positive sentiment. Their lounge at Bangalore airport is praised for excellent food, comfortable seating, and reliable WiFi. Air India lounges receive moderate ratings.",
  "security": "Security processes receive mixed feedback with 31% positive sentiment. While most passengers appreciate the efficiency, some report longer wait times during peak hours. Recent improvements in digital systems have helped.",
  "checkin": "Check-in experiences vary by airline. Air India's new digital kiosks receive 80% positive feedback for speed and efficiency. IndiGo maintains consistent positive ratings, while SpiceJet faces challenges with staff communication.",
  "default": "I understand you're asking about Bangalore airport experiences. Based on our AI analysis of social media data, I can provide insights about sentiment, airline performance, and passenger feedback across various airport services."
};

async function getResponse(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase();

  // Check for predefined sample responses first
  if (lowerQuery.includes("sentiment") || lowerQuery.includes("indigo")) {
    return mockResponses.sentiment;
  } else if (lowerQuery.includes("luggage") || lowerQuery.includes("baggage")) {
    return mockResponses.luggage;
  } else if (lowerQuery.includes("lounge")) {
    return mockResponses.lounge;
  } else if (lowerQuery.includes("security")) {
    return mockResponses.security;
  } else if (lowerQuery.includes("check") || lowerQuery.includes("checkin")) {
    return mockResponses.checkin;
  } else {
    // Route unknown queries to LLM service
    try {
      const response = await apiRequest('POST', '/api/aerobot/chat', { query });
      const data = await response.json();
      return data.response || mockResponses.default;
    } catch (error) {
      console.error('AeroBot API error:', error);
      return mockResponses.default;
    }
  }
}

export default function AeroBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm AVA (Aerobot Virtual Assistant), your AI assistant for Bangalore Airport insights. I can help you understand passenger sentiment, airline performance, and service feedback. What would you like to know?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (msg?: string) => {
    const currentQuery = msg !== undefined ? msg : inputValue;
    if (!currentQuery.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentQuery,
      sender: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Always connect to the llm-services at the backend.
      const response = await apiRequest("POST", "/api/aerobot/chat", { message: currentQuery });
      const data = await response.json();
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("AeroBot API error:", error);
      // Fallback to predefined responses or LLM service
      const fallbackContent = await getResponse(currentQuery);
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackContent,
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Sample queries trigger an immediate send.
  const handleSampleQuery = (query: string) => {
    setInputValue("");
    handleSendMessage(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AVA</h1>
              <p className="text-gray-400">AI-powered insights for Bangalore Airport</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sample Queries */}
          <div className="lg:col-span-1">
            <Card className="bg-dark-secondary border-dark-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center">
                  <Plane className="h-5 w-5 mr-2" />
                  Quick Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left justify-start text-sm text-gray-300 hover:text-white hover:bg-dark-accent h-auto py-3 px-3 whitespace-normal"
                      onClick={() => handleSampleQuery(query)}
                    >
                      <span className="text-left leading-relaxed">{query}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="bg-dark-secondary border-dark-border h-[600px] flex flex-col">
              <CardHeader className="border-b border-dark-border">
                <CardTitle className="text-lg font-semibold text-white">Chat with AeroBot</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === "user" ? "bg-blue-500" : "bg-gray-600"
                        }`}>
                          {message.sender === "user" ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-lg break-words ${
                            message.sender === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-dark-accent text-gray-100"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-dark-accent text-gray-100 px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t border-dark-border">
                  <div className="flex space-x-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about Bangalore airport experiences..."
                      className="flex-1 bg-dark-accent border-dark-border text-white placeholder-gray-500"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={isTyping || !inputValue.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Powered by AI analysis of social media sentiment data
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}