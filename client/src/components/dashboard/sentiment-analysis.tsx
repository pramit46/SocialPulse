import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { mockSentimentData } from "@/lib/mock-data";

const getSentimentColor = (value: number) => {
  if (value >= 0.5) return "text-green-400";
  if (value >= 0) return "text-yellow-400";
  return "text-red-400";
};

const getSentimentLabel = (value: number) => {
  if (value >= 0.7) return "Very Positive";
  if (value >= 0.3) return "Positive";
  if (value >= -0.3) return "Neutral";
  if (value >= -0.7) return "Negative";
  return "Very Negative";
};

const formatSentimentValue = (value: number) => {
  return (value * 100).toFixed(0) + "%";
};

export default function SentimentAnalysis() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <div className="mb-8">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          className="border-dark-border text-gray-400 hover:text-white hover:bg-dark-accent"
        >
          <Eye className="h-4 w-4 mr-2" />
          Show Sentiment Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Sentiment Analysis</h2>
          <p className="text-gray-400 text-sm">AI-powered sentiment insights for Bangalore Airport</p>
        </div>
        <Button 
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Sentiment */}
        <Card className="bg-dark-secondary border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Bangalore Airport Overall</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold mb-2 ${getSentimentColor(mockSentimentData.bangalore_airport.overall_sentiment)}`}>
                {formatSentimentValue(mockSentimentData.bangalore_airport.overall_sentiment)}
              </div>
              <div className="text-gray-400">
                {getSentimentLabel(mockSentimentData.bangalore_airport.overall_sentiment)}
              </div>
            </div>
            
            <div className="space-y-3">
              {Object.entries(mockSentimentData.bangalore_airport.categories).map(([category, value]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-300 capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${getSentimentColor(value)}`}>
                      {formatSentimentValue(value)}
                    </span>
                    <div className="w-16 h-2 bg-dark-accent rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          value >= 0.5 ? 'bg-green-400' : 
                          value >= 0 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.abs(value) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Airlines Sentiment */}
        <Card className="bg-dark-secondary border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Airlines Sentiment Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(mockSentimentData.airlines).map(([airline, data]) => (
                <div key={airline} className="flex justify-between items-center p-3 bg-dark-accent rounded-lg">
                  <div>
                    <div className="font-medium text-white capitalize">
                      {airline.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-400">
                      {data.mentions} mentions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getSentimentColor(data.sentiment)}`}>
                      {formatSentimentValue(data.sentiment)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getSentimentLabel(data.sentiment)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-sm text-blue-400 font-medium mb-1">
                AI Insight
              </div>
              <div className="text-xs text-gray-300">
                Vistara maintains highest satisfaction scores. SpiceJet requires immediate attention for baggage handling issues.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}