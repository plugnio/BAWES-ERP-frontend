'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authService } from "@/services/authService"
import { jwt } from "@/lib/jwt"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export function UserNav() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    nameEn: string;
    email: string;
    permissions: number;
  } | null>(null)

  useEffect(() => {
    const info = jwt.getUserInfo()
    if (info) {
      setUserInfo({
        nameEn: info.nameEn,
        email: info.email,
        permissions: info.permissions
      })
    }
  }, [])

  const handleLogout = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true)
      await authService.logout()
      // Always redirect to login after clearing tokens
      router.replace('/auth/login')
    } catch (error: any) {
      console.error('Logout failed:', error)
      // Only show error toast if it's not a 401 error
      if (error?.response?.status !== 401) {
        toast({
          title: "Logout Failed",
          description: error.message || "Failed to logout. Please try again.",
          variant: "destructive",
        })
      }
      // Still redirect to login
      router.replace('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }

  if (!userInfo) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(userInfo.nameEn)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userInfo.nameEn}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userInfo.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              const token = jwt.getDecodedToken()
              console.log('JWT Token Contents:', token)
            }}
          >
            View Permissions
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          disabled={isLoading}
          onClick={handleLogout}
        >
          {isLoading ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 