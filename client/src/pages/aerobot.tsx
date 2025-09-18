import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plane } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface AirportConfig {
  airport: {
    code: string;
    city: string;
    alternateCity: string;
    airportName: string;
  };
  ui: {
    greetingTemplate: string;
    scopeDescriptionTemplate: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

// DO NOT CHANGE the values of these constants:
// Sample queries will be dynamically generated based on airport config
const getConfigurableSampleQueries = (airportConfig?: AirportConfig) => {
  if (!airportConfig) {
    return [
      "How is the luggage handling experience?",
      "Which airline has the best lounge reviews?",
      "What are common complaints about security processes?",
      "Tell me about check-in experiences"
    ];
  }
  return [
    `What's the sentiment about ${airportConfig.airport.code} airport services?`,
    "How is the luggage handling experience?",
    "Which airline has the best lounge reviews?", 
    "What are common complaints about security processes?",
    "Tell me about check-in experiences"
  ];
};

// Dynamic mock responses based on airport config
const getConfigurableMockResponses = (airportConfig?: AirportConfig) => ({
  "sentiment": `Based on recent social media analysis, airlines have varying sentiment scores at ${airportConfig?.airport.city || 'the airport'}. Passengers particularly appreciate the quick security processes and seamless lounge access.`,
  "luggage": "Luggage handling shows mixed sentiment. While some airlines maintain good ratings, others have received negative feedback, primarily due to delayed and lost baggage incidents.",
  "lounge": `Airline lounges at ${airportConfig?.airport.city || 'the airport'} receive varying satisfaction scores. Premium lounges are praised for excellent food, comfortable seating, and reliable WiFi.`,
  "security": "Security processes receive mixed feedback. While most passengers appreciate the efficiency, some report longer wait times during peak hours. Recent improvements in digital systems have helped.",
  "checkin": "Check-in experiences vary by airline. New digital kiosks receive positive feedback for speed and efficiency. Different airlines maintain varying performance levels.",
  "delay": `Flight delays at ${airportConfig?.airport.city || 'the airport'} show varying patterns across airlines. Performance ranges from good to challenging punctuality rates. Weather and air traffic are primary delay factors.`,
  "default": `I understand you're asking about ${airportConfig?.airport.city || 'airport'} experiences. Based on our AI analysis of social media data, I can provide insights about sentiment, airline performance, and passenger feedback across various airport services.`
});

async function getResponse(query: string, airportConfig?: AirportConfig): Promise<string> {
  const lowerQuery = query.toLowerCase();
  const responses = getConfigurableMockResponses(airportConfig);

  // Check for predefined sample responses first
  if (lowerQuery.includes("sentiment")) {
    return responses.sentiment;
  } else if (lowerQuery.includes("luggage") || lowerQuery.includes("baggage")) {
    return responses.luggage;
  } else if (lowerQuery.includes("lounge")) {
    return responses.lounge;
  } else if (lowerQuery.includes("security")) {
    return responses.security;
  } else if (lowerQuery.includes("check") || lowerQuery.includes("checkin")) {
    return responses.checkin;
  } else if (lowerQuery.includes("delay")) {
    return responses.delay;
  } else {
    // Route unknown queries to LLM service
    try {
      const sessionId = 'user_' + Math.random().toString(36).substr(2, 9);
      const response = await apiRequest('POST', '/api/aerobot/chat', { message: query, sessionId });
      const data = await response.json();
      return data.response || responses.default;
    } catch (error) {
      console.error('AeroBot API error:', error);
      return responses.default;
    }
  }
}

export default function AeroBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load airport configuration
  const { data: airportConfig } = useQuery<AirportConfig>({
    queryKey: ['/api/airport-config'],
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initialize with airport-specific greeting when config loads
  useEffect(() => {
    if (airportConfig && messages.length === 0) {
      const greeting = airportConfig.ui.greetingTemplate.replace('${code}', airportConfig.airport.code).replace('${city}', airportConfig.airport.city);
      setMessages([{
        id: "1",
        content: greeting,
        sender: "bot",
        timestamp: new Date()
      }]);
    }
  }, [airportConfig, messages.length]);

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

    // Check if it's a sample query first
    const fallbackContent = await getResponse(currentQuery, airportConfig);
    const lowerQuery = currentQuery.toLowerCase();
    const isSampleQuery = lowerQuery.includes("sentiment") || lowerQuery.includes("indigo") ||
                         lowerQuery.includes("luggage") || lowerQuery.includes("baggage") ||
                         lowerQuery.includes("lounge") || lowerQuery.includes("security") ||
                         lowerQuery.includes("check") || lowerQuery.includes("checkin") ||
                         lowerQuery.includes("delay");

    if (isSampleQuery) {
      // Use mock response for sample queries
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackContent,
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    } else {
      // Route unknown queries to LLM service
      try {
        const sessionId = 'user_' + Math.random().toString(36).substr(2, 9);
        const response = await apiRequest("POST", "/api/aerobot/chat", { message: currentQuery, sessionId });
        const data = await response.json();
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || fallbackContent,
          sender: "bot",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error("AeroBot API error:", error);
        const fallbackResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: fallbackContent,
          sender: "bot",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackResponse]);
      } finally {
        setIsTyping(false);
        // Re-focus the input after sending message
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
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
              <p className="text-gray-400">{airportConfig ? airportConfig.ui.scopeDescriptionTemplate.replace('${code}', airportConfig.airport.code).replace('${city}', airportConfig.airport.city) : 'AI-powered airport insights'}</p>
            </div>
          </div>
        </div>

        {/* Clean Chat Interface - No Boxes */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Sample Queries - Inline buttons */}
          <div className="mb-6">
            <p className="text-gray-400 mb-3">Try these sample questions:</p>
            <div className="flex flex-wrap gap-2">
              {getConfigurableSampleQueries(airportConfig).map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="border-dark-border bg-dark-secondary/50 hover:bg-dark-secondary text-gray-300 hover:text-white text-xs"
                  onClick={() => handleSampleQuery(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="w-full">
            <Card className="bg-dark-secondary border-dark-border min-h-[600px] max-h-[800px] flex flex-col">
              <CardHeader className="border-b border-dark-border flex-shrink-0">
                <CardTitle className="text-lg font-semibold text-white">Chat with AeroBot</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === "user" ? "bg-blue-500" : "bg-gray-600"
                        }`}>
                          {message.sender === "user" ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-lg word-wrap ${
                            message.sender === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-dark-accent text-gray-100"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap word-wrap">{message.content}</p>
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
                
                <div className="p-4 border-t border-dark-border flex-shrink-0">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Ask about ${airportConfig?.airport.city || 'airport'} experiences...`}
                      className="flex-1 bg-dark-accent border-dark-border text-white placeholder-gray-500"
                      disabled={isTyping}
                      autoFocus
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