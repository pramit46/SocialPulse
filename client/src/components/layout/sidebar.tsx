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
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">@</span>
          </div>
          <span className="text-xl font-bold text-card-foreground">{airportConfig?.airport.code || '—'}</span>
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
                      "flex items-center px-4 py-3 text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 cursor-pointer",
                      isActive && "bg-accent text-accent-foreground"
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
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">Pramit</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
