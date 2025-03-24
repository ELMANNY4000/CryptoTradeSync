import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Globe, Coins } from "lucide-react";

const generalSettingsSchema = z.object({
  defaultCurrency: z.string(),
  language: z.string(),
  timeZone: z.string(),
  dateFormat: z.string(),
});

const tradingSettingsSchema = z.object({
  slippageTolerance: z.number().min(0.1).max(10),
  autoConfirmTransactions: z.boolean(),
  gasPreference: z.string(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  priceAlerts: z.boolean(),
  tradingUpdates: z.boolean(),
  securityAlerts: z.boolean(),
  marketingEmails: z.boolean(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;
type TradingSettingsFormValues = z.infer<typeof tradingSettingsSchema>;
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  // Forms setup
  const generalSettingsForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      defaultCurrency: "USD",
      language: "en",
      timeZone: "UTC",
      dateFormat: "MM/DD/YYYY",
    },
  });

  const tradingSettingsForm = useForm<TradingSettingsFormValues>({
    resolver: zodResolver(tradingSettingsSchema),
    defaultValues: {
      slippageTolerance: 0.5,
      autoConfirmTransactions: true,
      gasPreference: "standard",
    },
  });

  const notificationSettingsForm = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      priceAlerts: true,
      tradingUpdates: true,
      securityAlerts: true,
      marketingEmails: false,
    },
  });

  // Mutations
  const updateGeneralSettingsMutation = useMutation({
    mutationFn: async (data: GeneralSettingsFormValues) => {
      // Placeholder for API call
      return new Promise(resolve => setTimeout(() => resolve(data), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your general settings have been updated.",
      });
    },
  });

  const updateTradingSettingsMutation = useMutation({
    mutationFn: async (data: TradingSettingsFormValues) => {
      // Placeholder for API call
      return new Promise(resolve => setTimeout(() => resolve(data), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your trading preferences have been updated.",
      });
    },
  });

  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (data: NotificationSettingsFormValues) => {
      // Placeholder for API call
      return new Promise(resolve => setTimeout(() => resolve(data), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your notification settings have been updated.",
      });
    },
  });

  // Form submission handlers
  const onSubmitGeneralSettings = (data: GeneralSettingsFormValues) => {
    updateGeneralSettingsMutation.mutate(data);
  };

  const onSubmitTradingSettings = (data: TradingSettingsFormValues) => {
    updateTradingSettingsMutation.mutate(data);
  };

  const onSubmitNotificationSettings = (data: NotificationSettingsFormValues) => {
    updateNotificationSettingsMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Customize your experience and preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            <span>Trading</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your display and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalSettingsForm}>
                <form
                  onSubmit={generalSettingsForm.handleSubmit(onSubmitGeneralSettings)}
                  className="space-y-6"
                >
                  {/* Default Currency */}
                  <FormField
                    control={generalSettingsForm.control}
                    name="defaultCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="BTC">BTC - Bitcoin</SelectItem>
                            <SelectItem value="ETH">ETH - Ethereum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          All prices will be displayed in this currency
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Language */}
                  <FormField
                    control={generalSettingsForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Zone */}
                  <FormField
                    control={generalSettingsForm.control}
                    name="timeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC - Coordinated Universal Time</SelectItem>
                            <SelectItem value="EST">EST - Eastern Standard Time</SelectItem>
                            <SelectItem value="PST">PST - Pacific Standard Time</SelectItem>
                            <SelectItem value="GMT">GMT - Greenwich Mean Time</SelectItem>
                            <SelectItem value="JST">JST - Japan Standard Time</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date Format */}
                  <FormField
                    control={generalSettingsForm.control}
                    name="dateFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a date format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g., 01/31/2023)</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/01/2023)</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2023-01-31)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit"
                    disabled={updateGeneralSettingsMutation.isPending}
                  >
                    {updateGeneralSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Settings */}
        <TabsContent value="trading" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Preferences</CardTitle>
              <CardDescription>
                Configure your default trading parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...tradingSettingsForm}>
                <form
                  onSubmit={tradingSettingsForm.handleSubmit(onSubmitTradingSettings)}
                  className="space-y-6"
                >
                  {/* Slippage Tolerance */}
                  <FormField
                    control={tradingSettingsForm.control}
                    name="slippageTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slippage Tolerance: {field.value}%</FormLabel>
                        <FormControl>
                          <Slider
                            min={0.1}
                            max={10}
                            step={0.1}
                            defaultValue={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Your transaction will revert if the price changes unfavorably by more than this percentage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Auto-confirm Transactions */}
                  <FormField
                    control={tradingSettingsForm.control}
                    name="autoConfirmTransactions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Auto-confirm Transactions
                          </FormLabel>
                          <FormDescription>
                            Automatically confirm transactions without an additional prompt
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Gas Preference */}
                  <FormField
                    control={tradingSettingsForm.control}
                    name="gasPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gas Fee Preference</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a gas preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low (Slower, cheaper)</SelectItem>
                            <SelectItem value="standard">Standard (Recommended)</SelectItem>
                            <SelectItem value="high">High (Faster, more expensive)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Sets the default gas price for your transactions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit"
                    disabled={updateTradingSettingsMutation.isPending}
                  >
                    {updateTradingSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationSettingsForm}>
                <form
                  onSubmit={notificationSettingsForm.handleSubmit(onSubmitNotificationSettings)}
                  className="space-y-6"
                >
                  {/* Email Notifications */}
                  <FormField
                    control={notificationSettingsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications for important account activities
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Price Alerts */}
                  <FormField
                    control={notificationSettingsForm.control}
                    name="priceAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Price Alerts</FormLabel>
                          <FormDescription>
                            Receive notifications when your configured price alerts are triggered
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Trading Updates */}
                  <FormField
                    control={notificationSettingsForm.control}
                    name="tradingUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Trading Updates</FormLabel>
                          <FormDescription>
                            Receive notifications about your trades, orders, and liquidity pools
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Security Alerts */}
                  <FormField
                    control={notificationSettingsForm.control}
                    name="securityAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Security Alerts</FormLabel>
                          <FormDescription>
                            Receive notifications about security-related activities (new login, password change, etc.)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Marketing Emails */}
                  <FormField
                    control={notificationSettingsForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Marketing Emails</FormLabel>
                          <FormDescription>
                            Receive promotional emails and newsletters about new features
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit"
                    disabled={updateNotificationSettingsMutation.isPending}
                  >
                    {updateNotificationSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}