// Mock data to be migrated to MongoDB
export const mockChartData = {
  engagement: [
    { month: "Jan", likes: 12000, shares: 3000, comments: 5000 },
    { month: "Feb", likes: 19000, shares: 5000, comments: 8000 },
    { month: "Mar", likes: 15000, shares: 4000, comments: 6000 },
    { month: "Apr", likes: 25000, shares: 7000, comments: 12000 },
    { month: "May", likes: 22000, shares: 6000, comments: 10000 },
    { month: "Jun", likes: 30000, shares: 8000, comments: 15000 }
  ],
  platforms: [
    { name: "Twitter", value: 35, color: "#3B82F6" },
    { name: "Reddit", value: 25, color: "#F97316" },
    { name: "Instagram", value: 20, color: "#EC4899" },
    { name: "Facebook", value: 12, color: "#1877F2" },
    { name: "YouTube", value: 8, color: "#EF4444" },
    { name: "Vimeo", value: 10, color: "#AB4444" }
  ]
};

export const mockInsights = [
  {
    id: "1",
    type: "optimization",
    title: "Improve Luggage Handling",
    description: "Negative sentiment around baggage handling increased 40%. Address SpiceJet service issues.",
    actionText: "View Details",
    color: "red"
  },
  {
    id: "2",
    type: "strategy",
    title: "Promote Lounge Services",
    description: "Vistara lounge receives 90% positive sentiment. Highlight premium amenities.",
    actionText: "Implement",
    color: "green"
  },
  {
    id: "3",
    type: "engagement",
    title: "Security Process Optimization",
    description: "Mixed feedback on security speed. Consider process improvements.",
    actionText: "Learn More",
    color: "yellow"
  }
];

export const mockSentimentData = {
  bangalore_airport: {
    overall_sentiment: 0.42,
    categories: {
      ease_of_booking: 0.65,
      check_in: 0.58,
      luggage_handling: -0.23,
      security: 0.31,
      lounge: 0.78,
      amenities: 0.69,
      communication: 0.12
    }
  },
  airlines: {
    indigo: { sentiment: 0.72, mentions: 234 },
    spicejet: { sentiment: -0.45, mentions: 189 },
    air_india: { sentiment: 0.34, mentions: 156 },
    vistara: { sentiment: 0.83, mentions: 98 },
    airvistara: { sentiment: 0.81, mentions: 67 }
  }
};