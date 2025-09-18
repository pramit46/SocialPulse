import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChartLine, 
  MessageCircle, 
  Database, 
  Settings, 
  User,
  Bot
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  {
    name: "Social Pulse",
    href: "/pulse",
    icon: ChartLine,
  },
  {
    name: "AVA",
    href: "/ava",
    icon: Bot,
  },
  {
    name: "Data Management",
    href: "/data-management",
    icon: Database,
  },
  {
    name: "Talk to Us",
    href: "/talk-to-us",
    icon: MessageCircle,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface AirportConfig {
  airport: {
    code: string;
    city: string;
  };
  ui: {
    botDisplayNameTemplate: string;
  };
}

export default function Sidebar() {
  const [location] = useLocation();
  
  // Load airport configuration
  const { data: airportConfig } = useQuery<AirportConfig>({
    queryKey: ['/api/airport-config'],
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  return (
    <aside className="w-64 bg-dark-secondary border-r border-dark-border flex flex-col">
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">@</span>
          </div>
          <span className="text-xl font-bold text-white">{airportConfig?.airport.code || '—'}</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/pulse");
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-dark-accent hover:text-white transition-colors duration-200 cursor-pointer",
                      isActive && "bg-dark-accent text-white"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Pramit</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
