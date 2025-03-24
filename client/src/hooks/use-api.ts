import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useApi<T, P = unknown>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const execute = async (
    apiFunc: (params: P) => Promise<T>,
    params: P,
    options?: {
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFunc(params);
      
      if (options?.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
          variant: "default",
        });
      }
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      toast({
        title: "Error",
        description: options?.errorMessage || error.message || "An error occurred",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    execute,
  };
}
