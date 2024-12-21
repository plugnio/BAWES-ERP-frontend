'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useServices } from '@/hooks';
import { getApiClient } from '@/lib/sdk/api';

// Remove the strict interface to allow any token fields
interface DecodedToken {
  [key: string]: any;
}

export function DebugPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const apiClient = getApiClient();

  // Update token and decoded token on mount and token changes
  useEffect(() => {
    const updateTokenState = () => {
      const currentToken = apiClient.getAccessToken();
      setToken(currentToken);
      if (currentToken) {
        const payload = apiClient.getTokenPayload();
        setDecodedToken(payload);
      } else {
        setDecodedToken(null);
      }
    };

    // Initial update
    updateTokenState();

    // Subscribe to token changes
    const unsubscribe = apiClient.onTokenChange(() => updateTokenState());
    return unsubscribe;
  }, []);

  // Update time remaining display
  useEffect(() => {
    if (!decodedToken?.exp) return;

    const updateTimeRemaining = () => {
      setTimeRemaining(decodedToken.exp * 1000 - Date.now());
    };

    // Update immediately
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [decodedToken]);

  if (!token || !decodedToken) {
    return null;
  }

  const minutesRemaining = Math.floor(timeRemaining / 1000 / 60);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed bottom-0 right-0 w-96 bg-background border border-border shadow-lg rounded-t-lg z-50"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Debug Panel
          </span>
          <Badge variant="outline" className="ml-2">
            {minutesRemaining}m
          </Badge>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border-t border-border">
        <Card className="p-4 space-y-6 bg-card text-card-foreground">
          {decodedToken.permissions && decodedToken.permissions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Permissions</h4>
              <div className="flex flex-wrap gap-1.5">
                {decodedToken.permissions.map((permission: string) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Token Details</h4>
            <div className="space-y-3">
              {Object.entries(decodedToken).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{key}</p>
                  <pre className="text-xs p-2 rounded-md bg-muted/50 overflow-auto">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Bearer Token</h4>
            <pre className="text-xs p-2 rounded-md bg-muted/50 overflow-auto break-all whitespace-pre-wrap">
              Bearer {token}
            </pre>
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
} 