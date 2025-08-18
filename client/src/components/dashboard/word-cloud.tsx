import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";

// Mock word cloud data with sentiment-based colors
const wordCloudData = [
  { word: "excellent", count: 145, sentiment: 0.9, size: 48 },
  { word: "delay", count: 89, sentiment: -0.7, size: 36 },
  { word: "comfortable", count: 78, sentiment: 0.8, size: 32 },
  { word: "efficient", count: 67, sentiment: 0.7, size: 28 },
  { word: "crowded", count: 56, sentiment: -0.5, size: 24 },
  { word: "clean", count: 54, sentiment: 0.6, size: 24 },
  { word: "staff", count: 49, sentiment: 0.3, size: 22 },
  { word: "waiting", count: 45, sentiment: -0.3, size: 20 },
  { word: "smooth", count: 43, sentiment: 0.7, size: 20 },
  { word: "security", count: 41, sentiment: 0.1, size: 18 },
  { word: "lounge", count: 38, sentiment: 0.8, size: 18 },
  { word: "terminal", count: 36, sentiment: 0.2, size: 16 },
  { word: "baggage", count: 34, sentiment: -0.4, size: 16 },
  { word: "boarding", count: 32, sentiment: 0.4, size: 16 },
  { word: "food", count: 30, sentiment: 0.5, size: 14 },
  { word: "wifi", count: 28, sentiment: 0.6, size: 14 },
  { word: "quick", count: 26, sentiment: 0.7, size: 14 },
  { word: "helpful", count: 24, sentiment: 0.8, size: 12 },
  { word: "expensive", count: 22, sentiment: -0.6, size: 12 },
  { word: "modern", count: 20, sentiment: 0.6, size: 12 },
  { word: "spacious", count: 18, sentiment: 0.7, size: 10 },
  { word: "organized", count: 16, sentiment: 0.6, size: 10 },
  { word: "confusing", count: 14, sentiment: -0.5, size: 10 },
  { word: "punctual", count: 12, sentiment: 0.8, size: 8 },
  { word: "rude", count: 10, sentiment: -0.8, size: 8 }
];

const getSentimentColor = (sentiment: number) => {
  if (sentiment >= 0.6) return "text-green-400";
  if (sentiment >= 0.3) return "text-green-300";
  if (sentiment >= 0) return "text-gray-300";
  if (sentiment >= -0.3) return "text-yellow-400";
  if (sentiment >= -0.6) return "text-orange-400";
  return "text-red-400";
};

const getSentimentBg = (sentiment: number) => {
  if (sentiment >= 0.6) return "bg-green-400/10 hover:bg-green-400/20";
  if (sentiment >= 0.3) return "bg-green-300/10 hover:bg-green-300/20";
  if (sentiment >= 0) return "bg-gray-300/10 hover:bg-gray-300/20";
  if (sentiment >= -0.3) return "bg-yellow-400/10 hover:bg-yellow-400/20";
  if (sentiment >= -0.6) return "bg-orange-400/10 hover:bg-orange-400/20";
  return "bg-red-400/10 hover:bg-red-400/20";
};

export default function WordCloud() {
  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-400" />
          Buzz Words Cloud
        </CardTitle>
        <p className="text-sm text-gray-400">
          Word size shows frequency • Colors indicate sentiment (green = positive, red = negative)
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 items-center justify-center min-h-[280px] p-4">
          {wordCloudData.map((item, index) => (
            <div
              key={index}
              className={`
                inline-block px-3 py-1 rounded-lg cursor-pointer transition-all duration-200
                ${getSentimentColor(item.sentiment)} 
                ${getSentimentBg(item.sentiment)}
                hover:scale-110 hover:shadow-lg
              `}
              style={{
                fontSize: `${item.size}px`,
                lineHeight: '1.2',
                fontWeight: item.size > 20 ? '600' : '500'
              }}
              title={`"${item.word}" - ${item.count} mentions - Sentiment: ${(item.sentiment * 100).toFixed(0)}%`}
            >
              {item.word}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-dark-border">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-gray-400">Very Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded"></div>
              <span className="text-gray-400">Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-gray-400">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-gray-400">Mixed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span className="text-gray-400">Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-gray-400">Very Negative</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}