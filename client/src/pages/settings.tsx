import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, UserPlus, Users, CheckCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const roleColors = {
  admin: "bg-red-500/20 text-red-400",
  editor: "bg-blue-500/20 text-blue-400",
  viewer: "bg-gray-500/20 text-gray-400",
};

const roleLabels = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export default function Settings() {
  const [settings, setSettings] = useState({
    realTimeCollection: true,
    dataRetention: "90",
    autoCleanup: true,
    emailReports: true,
    alertNotifications: false,
    wordCloudMaxWords: 50,
    targetAirlines: ["indigo", "spicejet", "vistara", "air_india"],
    chatModel: "deepseek-r1:8b",
    embeddingModel: "deepseek-r1:8b", 
    sentimentModel: "deepseek-r1:8b"
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "editor",
  });

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isDarkMode, toggleTheme } = useTheme();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      toast({
        title: "User created successfully!",
        description: "The new user has been added to the system.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserDialogOpen(false);
      setNewUser({ name: "", email: "", role: "editor" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted successfully!",
        description: "The user has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: string, value: boolean | string | number | string[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved successfully!",
      description: "Your preferences have been updated.",
    });
  };

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Please fill all fields",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        <div className="space-y-8">
          {/* User Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-card-foreground">Add New User</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Create a new user account with appropriate permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-card-foreground">Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter user name"
                          value={newUser.name}
                          onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-card-foreground">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-card-foreground">Role</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer - View only access</SelectItem>
                            <SelectItem value="editor">Editor - Can edit content</SelectItem>
                            <SelectItem value="admin">Admin - Full management access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Role</TableHead>
                      <TableHead className="text-muted-foreground">Created</TableHead>
                      <TableHead className="text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(users as User[]).map((user: User) => (
                      <TableRow key={user.id} className="border-border">
                        <TableCell className="text-card-foreground">
                          <div className="flex items-center gap-2">
                            {user.name}
                            {user.role === 'super_admin' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                            {roleLabels[user.role as keyof typeof roleLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.role !== 'super_admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={deleteUserMutation.isPending}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Data Collection Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">Data Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-card-foreground">Real-time Collection</Label>
                    <p className="text-sm text-muted-foreground">Collect data in real-time from connected platforms</p>
                  </div>
                  <Switch
                    checked={settings.realTimeCollection}
                    onCheckedChange={(checked) => handleSettingChange("realTimeCollection", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-card-foreground">Data Retention</Label>
                    <p className="text-sm text-muted-foreground">Keep data for analytics and insights</p>
                  </div>
                  <Select 
                    value={settings.dataRetention} 
                    onValueChange={(value) => handleSettingChange("dataRetention", value)}
                  >
                    <SelectTrigger className="w-32 bg-background border-border text-foreground">
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
                    <Label className="font-medium text-card-foreground">Auto Cleanup</Label>
                    <p className="text-sm text-muted-foreground">Automatically remove old data based on retention policy</p>
                  </div>
                  <Switch
                    checked={settings.autoCleanup}
                    onCheckedChange={(checked) => handleSettingChange("autoCleanup", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-card-foreground flex items-center gap-2">                      
                      Theme {isDarkMode ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isDarkMode ? 'Switch to light theme for better visibility' : 'Switch to dark theme for reduced eye strain'}
                    </p>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Configuration */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">Analytics Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="font-medium text-card-foreground">Word Cloud Max Words</Label>
                    <p className="text-sm text-muted-foreground">Maximum number of words to display in the word cloud</p>
                  </div>
                  <Input
                    type="number"
                    value={settings.wordCloudMaxWords}
                    onChange={(e) => handleSettingChange("wordCloudMaxWords", parseInt(e.target.value) || 50)}
                    className="w-20 bg-background border-border text-foreground text-center"
                    min="10"
                    max="200"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="font-medium text-card-foreground">Target Airlines</Label>
                    <p className="text-sm text-muted-foreground">Airlines to monitor for data collection and analysis</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["indigo", "spicejet", "vistara", "air_india"].map((airline) => (
                      <div key={airline} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={airline}
                          checked={settings.targetAirlines.includes(airline)}
                          onChange={(e) => {
                            const newAirlines = e.target.checked
                              ? [...settings.targetAirlines, airline]
                              : settings.targetAirlines.filter(a => a !== airline);
                            handleSettingChange("targetAirlines", newAirlines);
                          }}
                          className="rounded border-border"
                        />
                        <Label htmlFor={airline} className="text-muted-foreground capitalize">
                          {airline.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Models Configuration */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">AI Models Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <Label className="font-medium text-card-foreground">Chat Model</Label>
                    <p className="text-sm text-muted-foreground">Model used for AVA chatbot responses</p>
                  </div>
                  <Select 
                    value={settings.chatModel} 
                    onValueChange={(value) => handleSettingChange("chatModel", value)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek-r1:8b">DeepSeek R1 8B</SelectItem>
                      <SelectItem value="deepseek-r1:14b">DeepSeek R1 14B</SelectItem>
                      <SelectItem value="deepseek-r1:32b">DeepSeek R1 32B</SelectItem>
                      <SelectItem value="llama3.2:8b">Llama 3.2 8B</SelectItem>
                      <SelectItem value="llama3.2:70b">Llama 3.2 70B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="font-medium text-card-foreground">Embedding Model</Label>
                    <p className="text-sm text-muted-foreground">Model used for text embeddings and semantic search</p>
                  </div>
                  <Select 
                    value={settings.embeddingModel} 
                    onValueChange={(value) => handleSettingChange("embeddingModel", value)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek-r1:8b">DeepSeek R1 8B</SelectItem>
                      <SelectItem value="nomic-embed-text">Nomic Embed Text</SelectItem>
                      <SelectItem value="all-minilm">All MiniLM</SelectItem>
                      <SelectItem value="mxbai-embed-large">MxBai Embed Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="font-medium text-card-foreground">Sentiment Analysis Model</Label>
                    <p className="text-sm text-muted-foreground">Model used for analyzing sentiment of social media posts</p>
                  </div>
                  <Select 
                    value={settings.sentimentModel} 
                    onValueChange={(value) => handleSettingChange("sentimentModel", value)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek-r1:8b">DeepSeek R1 8B</SelectItem>
                      <SelectItem value="deepseek-r1:14b">DeepSeek R1 14B</SelectItem>
                      <SelectItem value="llama3.2:8b">Llama 3.2 8B</SelectItem>
                      <SelectItem value="phi3:14b">Phi 3 14B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-card-foreground">Email Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive weekly analytics reports via email</p>
                  </div>
                  <Switch
                    checked={settings.emailReports}
                    onCheckedChange={(checked) => handleSettingChange("emailReports", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-card-foreground">Alert Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified about unusual activity or sentiment changes</p>
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
            <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}