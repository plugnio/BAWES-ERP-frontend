'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Cookies from 'js-cookie';

// Remove the strict interface to allow any token fields
interface DecodedToken {
  [key: string]: any;
}

export function DebugPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get token from cookies
    const accessToken = Cookies.get('accessToken');
    setToken(accessToken || null);

    if (accessToken) {
      try {
        // Decode JWT without verification
        const base64Url = accessToken.split('.')[1];
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

  // Update token and decoded token when cookies change
  useEffect(() => {
    const checkToken = () => {
      const accessToken = Cookies.get('accessToken');
      if (accessToken !== token) {
        setToken(accessToken || null);
        if (accessToken) {
          try {
            const base64Url = accessToken.split('.')[1];
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
        } else {
          setDecodedToken(null);
        }
      }
    };

    // Check every second for token changes
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [token]);

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
          {decodedToken.permissions && decodedToken.permissions.length > 0 && (
            <div>
              <h4 className="font-medium">Permissions</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {decodedToken.permissions.map((permission: string) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="font-medium">Token Details</h4>
            <div className="text-sm mt-2 space-y-1">
              {Object.entries(decodedToken).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <p className="font-medium">{key}:</p>
                  <pre className="text-xs bg-gray-50 p-1 rounded">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium">Bearer Token</h4>
            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 break-all whitespace-pre-wrap">
              Bearer {token}
            </pre>
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
} 