import { SocialEvent } from "@shared/schema";

export const mockSocialEvents: SocialEvent[] = [
  {
    id: "1",
    author_id: "twitter_123",
    author_name: "@traveler_bng",
    clean_event_text: "Just flew through Bangalore airport with IndiGo - the new terminal is amazing! Security was quick and lounge access was seamless.",
    engagement_metrics: {
      comments: 89,
      likes: 1200,
      shares: 234
    },
    event_content: "Just flew through #BangaloreAirport with @IndiGo6E - the new terminal is amazing! Security was quick and lounge access was seamless. Great experience overall! ✈️ #Travel #IndiGo",
    event_id: "tw_1234567890",
    event_title: "Great experience at Bangalore Airport",
    event_url: "https://twitter.com/traveler_bng/status/1234567890",
    parent_event_id: null,
    platform: "Twitter",
    timestamp_utc: "2024-01-15T14:30:00Z",
    sentiment_analysis: {
      overall_sentiment: 0.8,
      sentiment_score: 0.9,
      categories: {
        ease_of_booking: null,
        check_in: 0.7,
        luggage_handling: null,
        security: 0.8,
        lounge: 0.9,
        amenities: 0.8,
        communication: null
      }
    },
    location_focus: "bangalore_airport",
    airline_mentioned: "indigo",
    created_at: new Date()
  },
  {
    id: "2",
    author_id: "reddit_456",
    author_name: "frequent_flyer_blr",
    clean_event_text: "SpiceJet baggage handling at Bangalore airport was terrible today. Lost my luggage and no communication from staff about when it will arrive.",
    engagement_metrics: {
      comments: 127,
      likes: 856,
      shares: 45
    },
    event_content: "SpiceJet baggage handling at Bangalore airport was terrible today. Lost my luggage and no communication from staff about when it will arrive. Very disappointed with the service.",
    event_id: "rd_9876543210",
    event_title: "Poor baggage handling experience",
    event_url: "https://reddit.com/r/bangalore/comments/9876543210",
    parent_event_id: null,
    platform: "Reddit",
    timestamp_utc: "2024-01-15T13:45:00Z",
    sentiment_analysis: {
      overall_sentiment: -0.7,
      sentiment_score: 0.85,
      categories: {
        ease_of_booking: null,
        check_in: null,
        luggage_handling: -0.9,
        security: null,
        lounge: null,
        amenities: null,
        communication: -0.8
      }
    },
    location_focus: "bangalore_airport",
    airline_mentioned: "spicejet",
    created_at: new Date()
  },
  {
    id: "3",
    author_id: "instagram_789",
    author_name: "aviation_enthusiast",
    clean_event_text: "Air India's new check-in process at Bangalore airport is much faster now. The digital kiosks work perfectly and staff is helpful.",
    engagement_metrics: {
      comments: 89,
      likes: 2100,
      shares: 156
    },
    event_content: "Air India's new check-in process at #BangaloreAirport is much faster now! 🎉 The digital kiosks work perfectly and staff is helpful. Great improvement! #AirIndia #Aviation",
    event_id: "ig_5555444433",
    event_title: "Improved check-in experience",
    event_url: "https://instagram.com/p/5555444433",
    parent_event_id: null,
    platform: "Instagram",
    timestamp_utc: "2024-01-15T12:15:00Z",
    sentiment_analysis: {
      overall_sentiment: 0.6,
      sentiment_score: 0.8,
      categories: {
        ease_of_booking: null,
        check_in: 0.8,
        luggage_handling: null,
        security: null,
        lounge: null,
        amenities: 0.6,
        communication: 0.7
      }
    },
    location_focus: "bangalore_airport",
    airline_mentioned: "air_india",
    created_at: new Date()
  },
  {
    id: "4",
    author_id: "facebook_101",
    author_name: "business_traveler",
    clean_event_text: "Vistara lounge at Bangalore airport exceeded expectations. Great food, comfortable seating, and excellent WiFi for work.",
    engagement_metrics: {
      comments: 45,
      likes: 890,
      shares: 78
    },
    event_content: "Vistara lounge at Bangalore airport exceeded expectations! Great food, comfortable seating, and excellent WiFi for work. Perfect for business travelers. #Vistara #BangaloreAirport",
    event_id: "fb_9988776655",
    event_title: "Excellent lounge experience",
    event_url: "https://facebook.com/posts/9988776655",
    parent_event_id: null,
    platform: "Facebook",
    timestamp_utc: "2024-01-15T11:30:00Z",
    sentiment_analysis: {
      overall_sentiment: 0.9,
      sentiment_score: 0.95,
      categories: {
        ease_of_booking: null,
        check_in: null,
        luggage_handling: null,
        security: null,
        lounge: 0.9,
        amenities: 0.8,
        communication: null
      }
    },
    location_focus: "bangalore_airport",
    airline_mentioned: "vistara",
    created_at: new Date()
  },
  {
    id: "5",
    author_id: "youtube_555",
    author_name: "travel_vlogger",
    clean_event_text: "Made a complete review of Bangalore airport facilities. Security processes could be faster, but overall amenities are world-class.",
    engagement_metrics: {
      comments: 234,
      likes: 3400,
      shares: 567
    },
    event_content: "Complete review of Bangalore airport facilities in my latest video! Security processes could be faster, but overall amenities are world-class. Check it out! #BangaloreAirport #TravelReview",
    event_id: "yt_7766554433",
    event_title: "Bangalore Airport Complete Review",
    event_url: "https://youtube.com/watch?v=7766554433",
    parent_event_id: null,
    platform: "YouTube",
    timestamp_utc: "2024-01-15T10:15:00Z",
    sentiment_analysis: {
      overall_sentiment: 0.4,
      sentiment_score: 0.7,
      categories: {
        ease_of_booking: null,
        check_in: null,
        luggage_handling: null,
        security: -0.3,
        lounge: null,
        amenities: 0.8,
        communication: null
      }
    },
    location_focus: "bangalore_airport",
    airline_mentioned: null,
    created_at: new Date()
  }
];

export const mockMetrics = {
  totalViews: "2.4M",
  totalLikes: "187K",
  totalShares: "23.1K",
  totalComments: "45.2K",
  viewsGrowth: "+12.5%",
  likesGrowth: "+8.2%",
  sharesGrowth: "+15.7%",
  commentsGrowth: "+22.1%"
};

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
    { name: "YouTube", value: 8, color: "#EF4444" }
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
