"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Globe, Lock, Shield, User } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("Cocacola Inc.");
  const [companyEmail, setCompanyEmail] = useState("admin@cocacola.com");
  const [companyWebsite, setCompanyWebsite] = useState("https://cocacola.com");
  const [companyAddress, setCompanyAddress] = useState(
    "123 Beverage St, Atlanta, GA 30313",
  );
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("en-US");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const handleSaveSettings = (section: string) => {
    // In a real app, this would save the settings to your backend
    toast({
      title: "Settings saved",
      description: `Your ${section} settings have been updated successfully.`,
    });
  };

  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-[#1a1625]'>
        <div className='h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-purple-500'></div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Settings</h2>
          <p className='text-gray-400 mt-2'>
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue='general' className='w-full'>
          <TabsList className='grid w-full max-w-3xl grid-cols-5 mb-8'>
            <TabsTrigger value='general' className='data-[state=active]:bg-purple-600'>
              <User className='h-4 w-4 mr-2' />
              General
            </TabsTrigger>
            <TabsTrigger value='appearance' className='data-[state=active]:bg-purple-600'>
              <Globe className='h-4 w-4 mr-2' />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value='notifications'
              className='data-[state=active]:bg-purple-600'
            >
              <Bell className='h-4 w-4 mr-2' />
              Notifications
            </TabsTrigger>
            <TabsTrigger value='security' className='data-[state=active]:bg-purple-600'>
              <Shield className='h-4 w-4 mr-2' />
              Security
            </TabsTrigger>
            <TabsTrigger value='api' className='data-[state=active]:bg-purple-600'>
              <Lock className='h-4 w-4 mr-2' />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value='general'>
            <Card className='bg-[#231c35] border-[#2a2139] text-white'>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription className='text-gray-400'>
                  Update your company information and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='company-name'>Company Name</Label>
                    <Input
                      id='company-name'
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='company-email'>Email Address</Label>
                    <Input
                      id='company-email'
                      type='email'
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='company-website'>Website</Label>
                    <Input
                      id='company-website'
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                    />
                  </div>

                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='company-address'>Address</Label>
                    <Textarea
                      id='company-address'
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                      rows={3}
                    />
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button
                    className='bg-purple-600 hover:bg-purple-700'
                    onClick={() => handleSaveSettings("general")}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='appearance'>
            <Card className='bg-[#231c35] border-[#2a2139] text-white'>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription className='text-gray-400'>
                  Customize your display preferences and regional settings.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='timezone'>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger
                        id='timezone'
                        className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                      >
                        <SelectValue placeholder='Select timezone' />
                      </SelectTrigger>
                      <SelectContent className='bg-[#231c35] border-[#2a2139] text-white'>
                        <SelectItem value='America/New_York'>
                          Eastern Time (ET)
                        </SelectItem>
                        <SelectItem value='America/Chicago'>Central Time (CT)</SelectItem>
                        <SelectItem value='America/Denver'>Mountain Time (MT)</SelectItem>
                        <SelectItem value='America/Los_Angeles'>
                          Pacific Time (PT)
                        </SelectItem>
                        <SelectItem value='Europe/London'>
                          Greenwich Mean Time (GMT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='language'>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger
                        id='language'
                        className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                      >
                        <SelectValue placeholder='Select language' />
                      </SelectTrigger>
                      <SelectContent className='bg-[#231c35] border-[#2a2139] text-white'>
                        <SelectItem value='en-US'>English (US)</SelectItem>
                        <SelectItem value='en-GB'>English (UK)</SelectItem>
                        <SelectItem value='es'>Spanish</SelectItem>
                        <SelectItem value='fr'>French</SelectItem>
                        <SelectItem value='de'>German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='date-format'>Date Format</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger
                        id='date-format'
                        className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                      >
                        <SelectValue placeholder='Select date format' />
                      </SelectTrigger>
                      <SelectContent className='bg-[#231c35] border-[#2a2139] text-white'>
                        <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                        <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                        <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button
                    className='bg-purple-600 hover:bg-purple-700'
                    onClick={() => handleSaveSettings("appearance")}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='notifications'>
            <Card className='bg-[#231c35] border-[#2a2139] text-white'>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription className='text-gray-400'>
                  Control how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Email Notifications</Label>
                      <p className='text-sm text-gray-400'>
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      className='data-[state=checked]:bg-purple-600'
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>SMS Notifications</Label>
                      <p className='text-sm text-gray-400'>
                        Receive notifications via text message
                      </p>
                    </div>
                    <Switch
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                      className='data-[state=checked]:bg-purple-600'
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Push Notifications</Label>
                      <p className='text-sm text-gray-400'>
                        Receive notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                      className='data-[state=checked]:bg-purple-600'
                    />
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button
                    className='bg-purple-600 hover:bg-purple-700'
                    onClick={() => handleSaveSettings("notification")}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='security'>
            <Card className='bg-[#231c35] border-[#2a2139] text-white'>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription className='text-gray-400'>
                  Manage your account security and authentication methods.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Two-Factor Authentication</Label>
                      <p className='text-sm text-gray-400'>
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorAuth}
                      onCheckedChange={setTwoFactorAuth}
                      className='data-[state=checked]:bg-purple-600'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='session-timeout'>Session Timeout (minutes)</Label>
                    <Input
                      id='session-timeout'
                      type='number'
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500 max-w-xs'
                      min='5'
                      max='120'
                    />
                    <p className='text-sm text-gray-400'>
                      Automatically log out after period of inactivity
                    </p>
                  </div>

                  <div className='pt-4'>
                    <Button variant='destructive' className='bg-red-600 hover:bg-red-700'>
                      Reset Password
                    </Button>
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button
                    className='bg-purple-600 hover:bg-purple-700'
                    onClick={() => handleSaveSettings("security")}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='api'>
            <Card className='bg-[#231c35] border-[#2a2139] text-white'>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription className='text-gray-400'>
                  Configure API access and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>API Access</Label>
                      <p className='text-sm text-gray-400'>
                        Enable or disable API access for your account
                      </p>
                    </div>
                    <Switch
                      checked={true}
                      className='data-[state=checked]:bg-purple-600'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>API Rate Limits</Label>
                    <div className='bg-[#1a1625] p-4 rounded-md'>
                      <div className='space-y-4'>
                        <div>
                          <div className='flex items-center justify-between mb-1'>
                            <span className='text-sm text-gray-300'>
                              Requests per minute
                            </span>
                            <span className='text-sm font-medium'>60</span>
                          </div>
                        </div>

                        <div>
                          <div className='flex items-center justify-between mb-1'>
                            <span className='text-sm text-gray-300'>
                              Requests per day
                            </span>
                            <span className='text-sm font-medium'>10,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='pt-4'>
                    <Button
                      variant='outline'
                      className='border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white'
                    >
                      View API Documentation
                    </Button>
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button
                    className='bg-purple-600 hover:bg-purple-700'
                    onClick={() => handleSaveSettings("api")}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
