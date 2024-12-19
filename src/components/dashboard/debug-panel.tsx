'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  permissions: string[];
}

export function DebugPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('access_token');
    setToken(storedToken);

    if (storedToken) {
      try {
        // Decode JWT without verification
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        setDecodedToken(JSON.parse(jsonPayload));
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  if (!token || !decodedToken) {
    return null;
  }

  const timeRemaining = decodedToken.exp * 1000 - Date.now();
  const minutesRemaining = Math.floor(timeRemaining / 1000 / 60);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed bottom-0 right-0 w-96 bg-white shadow-lg rounded-t-lg"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-2 text-sm font-medium"
        >
          Debug Panel
          <Badge variant="secondary">
            {minutesRemaining}m remaining
          </Badge>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4">
        <Card className="p-4 space-y-4">
          <div>
            <h4 className="font-medium">Permissions</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {decodedToken.permissions.map((permission) => (
                <Badge key={permission} variant="outline">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium">Token Details</h4>
            <div className="text-sm mt-2 space-y-1">
              <p>Subject: {decodedToken.sub}</p>
              <p>Issued: {new Date(decodedToken.iat * 1000).toLocaleString()}</p>
              <p>Expires: {new Date(decodedToken.exp * 1000).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
} 