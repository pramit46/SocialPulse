import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const platforms = [
  { name: "Twitter", icon: "fab fa-twitter", color: "bg-blue-500", connected: true, handle: "@your_handle" },
  { name: "Reddit", icon: "fab fa-reddit", color: "bg-orange-500", connected: true, handle: "u/your_username" },
  { name: "Facebook", icon: "fab fa-facebook", color: "bg-gray-500", connected: false, handle: null },
  { name: "Instagram", icon: "fab fa-instagram", color: "bg-pink-500", connected: false, handle: null },
  { name: "YouTube", icon: "fab fa-youtube", color: "bg-red-500", connected: false, handle: null },
];

export default function Settings() {
  const [settings, setSettings] = useState({
    realTimeCollection: true,
    dataRetention: "90",
    autoCleanup: true,
    emailReports: true,
    alertNotifications: false,
  });

  const { toast } = useToast();

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // Here you would typically send the settings to your API
    toast({
      title: "Settings saved successfully!",
      description: "Your preferences have been updated.",
    });
  };

  const handleConnectPlatform = (platformName: string) => {
    // Here you would typically handle OAuth flow for platform connection
    toast({
      title: "Connection initiated",
      description: `Starting connection process for ${platformName}...`,
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and application preferences</p>
        </div>

        <div className="space-y-8">
          {/* Platform Connections */}
          <Card className="bg-dark-secondary border-dark-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Platform Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platforms.map((platform) => (
                  <div key={platform.name} className="flex items-center justify-between p-4 bg-dark-accent rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                        <i className={`${platform.icon} text-white`}></i>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{platform.name}</h3>
                        <p className="text-sm text-gray-400">
                          {platform.connected ? `Connected as ${platform.handle}` : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={platform.connected ? "default" : "default"}
                      className={platform.connected ? "bg-green-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}
                      onClick={() => !platform.connected && handleConnectPlatform(platform.name)}
                      disabled={platform.connected}
                    >
                      {platform.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Collection Settings */}
          <Card className="bg-dark-secondary border-dark-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Data Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-white">Real-time Collection</Label>
                    <p className="text-sm text-gray-400">Collect data in real-time from connected platforms</p>
                  </div>
                  <Switch
                    checked={settings.realTimeCollection}
                    onCheckedChange={(checked) => handleSettingChange("realTimeCollection", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-white">Data Retention</Label>
                    <p className="text-sm text-gray-400">Keep data for analytics and insights</p>
                  </div>
                  <Select 
                    value={settings.dataRetention} 
                    onValueChange={(value) => handleSettingChange("dataRetention", value)}
                  >
                    <SelectTrigger className="w-32 bg-dark-accent border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">6 months</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-white">Auto-cleanup</Label>
                    <p className="text-sm text-gray-400">Automatically remove old data based on retention policy</p>
                  </div>
                  <Switch
                    checked={settings.autoCleanup}
                    onCheckedChange={(checked) => handleSettingChange("autoCleanup", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="bg-dark-secondary border-dark-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-white">Email Reports</Label>
                    <p className="text-sm text-gray-400">Receive weekly analytics reports via email</p>
                  </div>
                  <Switch
                    checked={settings.emailReports}
                    onCheckedChange={(checked) => handleSettingChange("emailReports", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-white">Alert Notifications</Label>
                    <p className="text-sm text-gray-400">Get notified about unusual activity or trends</p>
                  </div>
                  <Switch
                    checked={settings.alertNotifications}
                    onCheckedChange={(checked) => handleSettingChange("alertNotifications", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
