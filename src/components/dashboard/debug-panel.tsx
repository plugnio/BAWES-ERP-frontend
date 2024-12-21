'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useServices } from '@/hooks';

interface TokenState {
  hasToken: boolean;
  tokenLength: number;
  timeToExpiry: number;
  token: string | null;
  payload: any | null;
}

export function DebugPanel() {
  const { jwt, auth } = useServices();
  const [tokenState, setTokenState] = useState<TokenState>({
    hasToken: false,
    tokenLength: 0,
    timeToExpiry: 0,
    token: null,
    payload: null
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Update token state when component mounts or token changes
    const updateTokenState = () => {
      if (!mounted) return;

      // Get complete token state from JWT service
      const { token, payload, timeToExpiry } = jwt.getTokenState();
      
      // Handle no token case
      if (!token || !payload) {
        setTokenState(state => {
          if (!state.hasToken) return state; // No change needed
          return {
            hasToken: false,
            tokenLength: 0,
            timeToExpiry: 0,
            token: null,
            payload: null
          };
        });
        return;
      }

      // Update state only if something changed
      setTokenState(state => {
        // Check if any values actually changed
        if (
          state.token === token &&
          state.timeToExpiry === timeToExpiry &&
          state.payload === payload
        ) {
          return state; // No change needed
        }

        // Something changed, update state
        return {
          hasToken: true,
          tokenLength: token.length,
          timeToExpiry,
          token,
          payload
        };
      });
    };

    // Subscribe to token changes through auth service
    const unsubscribe = auth.onTokenChange(() => {
      if (mounted) {
        updateTokenState();
      }
    });

    // Initial state update
    updateTokenState();

    // Cleanup
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [jwt, auth]); // Dependencies on services

  if (!tokenState.hasToken) {
    return null;
  }

  const minutesRemaining = Math.floor(tokenState.timeToExpiry / 60);

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
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Token Details</h4>
            <div className="space-y-3">
              {Object.entries(tokenState).map(([key, value]) => {
                if (key === 'token' || key === 'payload') return null;
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{key}</p>
                    <pre className="text-xs p-2 rounded-md bg-muted/50 overflow-auto">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Bearer Token</h4>
            <pre className="text-xs p-2 rounded-md bg-muted/50 overflow-auto break-all whitespace-pre-wrap">
              Bearer {tokenState.token || ''}
            </pre>
          </div>
          {tokenState.payload && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Decoded Payload</h4>
              <pre className="text-xs p-2 rounded-md bg-muted/50 overflow-auto">
                {JSON.stringify(tokenState.payload, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
} 