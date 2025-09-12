import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const iconMap = {
  optimization: Lightbulb,
  strategy: TrendingUp,
  engagement: Users,
} as const;

const colorMap = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  green: "bg-green-500/10 border-green-500/20 text-green-400",
  yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  red: "bg-red-500/10 border-red-500/20 text-red-400",
};

const buttonColorMap = {
  blue: "text-blue-400 hover:text-blue-300",
  green: "text-green-400 hover:text-green-300",
  yellow: "text-yellow-400 hover:text-yellow-300",
  red: "text-red-400 hover:text-red-300",
};

export default function InsightsPanel() {
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 2;
  
  // Fetch insights from MongoDB
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/insights'],
    queryFn: async () => {
      const response = await fetch('/api/insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    refetchInterval: 300000, // 5 minutes
  });

  const totalPages = Math.ceil((insights?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const paginatedInsights = insights?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Actionable Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-400">Loading insights...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
          <span>Actionable Insights</span>
          {totalPages > 1 && (
            <span className="text-sm text-gray-400 font-normal">
              {currentPage + 1} of {totalPages}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paginatedInsights.map((insight: any) => {
            const Icon = iconMap[insight.type as keyof typeof iconMap];
            const colorClass = colorMap[insight.color as keyof typeof colorMap];
            const buttonColorClass = buttonColorMap[insight.color as keyof typeof buttonColorMap];
            
            return (
              <div key={insight.id} className={`p-4 border rounded-lg ${colorClass}`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 bg-${insight.color}-500 rounded-full flex items-center justify-center mt-0.5`}>
                    {Icon && <Icon className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`p-0 h-auto font-normal ${buttonColorClass} transition-colors`}
                    >
                      {insight.actionText} →
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-dark-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, index) => (
                <Button
                  key={index}
                  variant={currentPage === index ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(index)}
                  className={`w-8 h-8 ${
                    currentPage === index 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
