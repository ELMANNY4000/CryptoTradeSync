import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TransactionList } from "@/components/wallets/transaction-list";
import { User, Lock, Shield, Clock } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email(),
  username: z.string().min(3).max(50)
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  const { data: wallets, isLoading: isWalletsLoading } = useQuery({
    queryKey: ['/api/wallets'],
    enabled: !!user
  });

  const { data: kycInfo, isLoading: isKycLoading } = useQuery({
    queryKey: ['/api/kyc'],
    enabled: !!user
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      username: user?.username || ""
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  if (isAuthLoading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  if (!user) {
    return <div className="container mx-auto py-8 px-4">Please login to view your profile.</div>;
  }

  const userInitials = user.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.username.substring(0, 2).toUpperCase();

  const kycStatus = kycInfo?.verificationStatus || "not submitted";
  const kycBadgeColor = {
    "approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    "pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    "rejected": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    "not submitted": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
  }[kycStatus] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 lg:col-span-3">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar || ""} alt={user.username} />
                  <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{user.fullName || user.username}</CardTitle>
              <CardDescription>@{user.username}</CardDescription>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${kycBadgeColor}`}>
                  KYC: {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div>{user.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Member since</div>
                  <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Role</div>
                  <div>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-8 lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile information here</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Password</h3>
                    <p className="text-muted-foreground mb-4">Change your password to enhance your account security</p>
                    <Button>Change Password</Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-muted-foreground mb-4">
                      Add an extra layer of security to your account by enabling two-factor authentication
                    </p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Active Sessions</h3>
                    <p className="text-muted-foreground mb-4">
                      Manage your active login sessions
                    </p>
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-muted-foreground text-sm">Started: {new Date().toLocaleString()}</p>
                        </div>
                        <Button variant="destructive" size="sm">End Session</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>View your recent transactions and activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {isTransactionsLoading ? (
                    <div className="text-center py-4">Loading transactions...</div>
                  ) : (
                    <TransactionList 
                      transactions={transactions?.transactions || []} 
                      isLoading={isTransactionsLoading} 
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}