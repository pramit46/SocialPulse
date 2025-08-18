import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Users } from "lucide-react";
import { mockInsights } from "@/lib/mock-data";

const iconMap = {
  optimization: Lightbulb,
  strategy: TrendingUp,
  engagement: Users,
};

const colorMap = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  green: "bg-green-500/10 border-green-500/20 text-green-400",
  yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
};

const buttonColorMap = {
  blue: "text-blue-400 hover:text-blue-300",
  green: "text-green-400 hover:text-green-300",
  yellow: "text-yellow-400 hover:text-yellow-300",
};

export default function InsightsPanel() {
  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Actionable Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockInsights.map((insight) => {
            const Icon = iconMap[insight.type as keyof typeof iconMap];
            const colorClass = colorMap[insight.color as keyof typeof colorMap];
            const buttonColorClass = buttonColorMap[insight.color as keyof typeof buttonColorMap];
            
            return (
              <div key={insight.id} className={`p-4 border rounded-lg ${colorClass}`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 bg-${insight.color}-500 rounded-full flex items-center justify-center mt-0.5`}>
                    <Icon className="h-3 w-3 text-white" />
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
      </CardContent>
    </Card>
  );
}
