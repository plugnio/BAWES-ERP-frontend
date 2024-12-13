"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { authService } from "@/services/authService";
import { AuthCard } from "../shared/auth-card";

export function RegisterForm() {
    const router = useRouter();
    const [error, setError] = useState<string>("");

    const form = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            nameEn: "",
            nameAr: "",
        },
    });

    const onSubmit = async (data: RegisterInput) => {
        try {
            setError("");
            await authService.register(data);
            router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <AuthCard 
            title="Register"
            footer={
                <Button variant="link" onClick={() => router.push("/login")}>
                    Already have an account? Login
                </Button>
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="email@example.com" 
                                        type="email"
                                        autoComplete="email"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="password" 
                                        autoComplete="new-password"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nameEn"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (English)</FormLabel>
                                <FormControl>
                                    <Input 
                                        autoComplete="name"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nameAr"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (Arabic)</FormLabel>
                                <FormControl>
                                    <Input 
                                        dir="rtl" 
                                        lang="ar"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Registering..." : "Register"}
                    </Button>
                </form>
            </Form>
        </AuthCard>
    );
} 