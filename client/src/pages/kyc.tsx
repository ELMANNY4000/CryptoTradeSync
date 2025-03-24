import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle, CircleX } from "lucide-react";

const countryCodes = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "SG", label: "Singapore" },
];

const documentTypes = [
  { value: "passport", label: "Passport" },
  { value: "driverLicense", label: "Driver's License" },
  { value: "idCard", label: "National ID Card" },
];

const kycSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  country: z.string().min(1, "Country is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "Zip/Postal code is required"),
  documentType: z.string().min(1, "Document type is required"),
  documentNumber: z.string().min(1, "Document number is required"),
});

type KycFormValues = z.infer<typeof kycSchema>;

export default function KYC() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get existing KYC info if any
  const { data: kycInfo, isLoading } = useQuery({
    queryKey: ["/api/kyc"],
    enabled: !!user
  });
  
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      country: "",
      address: "",
      city: "",
      zipCode: "",
      documentType: "",
      documentNumber: "",
    }
  });
  
  // Prefill form when kycInfo is loaded
  useState(() => {
    if (kycInfo) {
      form.reset({
        firstName: kycInfo.firstName || "",
        lastName: kycInfo.lastName || "",
        dateOfBirth: kycInfo.dateOfBirth ? new Date(kycInfo.dateOfBirth).toISOString().split("T")[0] : "",
        country: kycInfo.country || "",
        address: kycInfo.address || "",
        city: kycInfo.city || "",
        zipCode: kycInfo.zipCode || "",
        documentType: kycInfo.documentType || "",
        documentNumber: kycInfo.documentNumber || "",
      });
    }
  });
  
  const submitKyc = useMutation({
    mutationFn: async (data: KycFormValues) => {
      const res = await apiRequest("POST", "/api/kyc", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC Information Submitted",
        description: "Your identity verification information has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An error occurred while submitting your information",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: KycFormValues) => {
    submitKyc.mutate(data);
  };
  
  const getStatusDisplay = () => {
    if (!kycInfo) return null;
    
    switch (kycInfo.verificationStatus) {
      case "verified":
        return (
          <div className="flex items-center bg-green-50 text-green-700 p-4 rounded-md mb-6 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Your identity has been verified. You have full access to all platform features.</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center bg-yellow-50 text-yellow-700 p-4 rounded-md mb-6 dark:bg-yellow-900/20 dark:text-yellow-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Your verification is pending review. This typically takes 1-2 business days.</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center bg-red-50 text-red-700 p-4 rounded-md mb-6 dark:bg-red-900/20 dark:text-red-400">
            <CircleX className="h-5 w-5 mr-2" />
            <span>Your verification was rejected. Please update your information and try again.</span>
          </div>
        );
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Identity Verification</h1>
      
      {getStatusDisplay()}
      
      <Card>
        <CardHeader>
          <CardTitle>Complete Your KYC</CardTitle>
          <CardDescription>
            To comply with regulations and enable trading functionality, we need to verify your identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country of Residence</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryCodes.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((docType) => (
                            <SelectItem key={docType.value} value={docType.value}>
                              {docType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  In a real application, you would be asked to upload photos of your ID documents and possibly complete a liveness check. This is a simplified version for demonstration purposes.
                </p>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitKyc.isPending || kycInfo?.verificationStatus === "verified" || kycInfo?.verificationStatus === "pending"}
                >
                  {submitKyc.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : kycInfo?.verificationStatus === "verified" ? (
                    "Already Verified"
                  ) : kycInfo?.verificationStatus === "pending" ? (
                    "Verification Pending"
                  ) : (
                    "Submit Verification"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
