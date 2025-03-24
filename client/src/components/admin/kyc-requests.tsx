import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function KycRequests() {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: kycRequests, isLoading } = useQuery({
    queryKey: ["/api/admin/kyc-requests"],
  });
  
  const approveKyc = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PUT", `/api/admin/kyc/${userId}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC Approved",
        description: "The user's KYC verification has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc-requests"] });
      setViewDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve KYC verification",
        variant: "destructive",
      });
    }
  });
  
  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };
  
  const handleApprove = (userId: number) => {
    approveKyc.mutate(userId);
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Pending KYC Verification Requests</h3>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : kycRequests?.length ? (
        <div className="space-y-4">
          {kycRequests.map((request: any) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                        Pending
                      </Badge>
                      <span className="font-medium">Request #{request.id}</span>
                    </div>
                    <h4 className="font-medium">
                      {request.user ? `${request.user.fullName || request.user.username}` : "Unknown User"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      User ID: {request.userId} | Submitted: {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(request.userId)}
                      disabled={approveKyc.isPending}
                    >
                      {approveKyc.isPending && approveKyc.variables === request.userId ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No pending KYC verification requests
        </div>
      )}
      
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>KYC Verification Details</DialogTitle>
            <DialogDescription>
              Review user verification information
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Personal Information</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">First Name:</div>
                      <div>{selectedRequest.firstName}</div>
                      
                      <div className="text-muted-foreground">Last Name:</div>
                      <div>{selectedRequest.lastName}</div>
                      
                      <div className="text-muted-foreground">Date of Birth:</div>
                      <div>{selectedRequest.dateOfBirth ? new Date(selectedRequest.dateOfBirth).toLocaleDateString() : "-"}</div>
                      
                      <div className="text-muted-foreground">Country:</div>
                      <div>{selectedRequest.country}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Address</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Address:</div>
                      <div>{selectedRequest.address}</div>
                      
                      <div className="text-muted-foreground">City:</div>
                      <div>{selectedRequest.city}</div>
                      
                      <div className="text-muted-foreground">Zip Code:</div>
                      <div>{selectedRequest.zipCode}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Identification</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Document Type:</div>
                      <div>{selectedRequest.documentType}</div>
                      
                      <div className="text-muted-foreground">Document Number:</div>
                      <div>{selectedRequest.documentNumber}</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 flex gap-2 justify-end">
                  <Button 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedRequest.userId)}
                    disabled={approveKyc.isPending}
                  >
                    {approveKyc.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                  <Button variant="destructive">
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
