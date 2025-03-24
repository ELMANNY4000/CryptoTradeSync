import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { KycRequests } from "@/components/admin/kyc-requests";
import { AlertTriangle } from "lucide-react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, KYC requests, and platform settings
        </p>
      </div>
      
      <div className="mb-6">
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="p-4 flex items-start">
            <AlertTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-400">Admin Access Only</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                This area is restricted to administrators only. Any actions taken here will affect the platform and its users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
              <TabsTrigger value="settings">Platform Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="mt-0">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="kyc" className="mt-0">
              <KycRequests />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <div className="py-8 text-center text-muted-foreground">
                Platform settings configuration is not available in this demo.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
