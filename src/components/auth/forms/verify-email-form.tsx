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
import { verifyEmailSchema, type VerifyEmailInput } from "@/lib/validations/auth";
import { authService } from "@/services/authService";
import { AuthCard } from "../shared/auth-card";

interface VerifyEmailFormProps {
    defaultEmail?: string;
}

export function VerifyEmailForm({ defaultEmail = "" }: VerifyEmailFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string>("");

    const form = useForm<VerifyEmailInput>({
        resolver: zodResolver(verifyEmailSchema),
        defaultValues: {
            email: defaultEmail,
            code: "",
        },
    });

    const onSubmit = async (data: VerifyEmailInput) => {
        try {
            setError("");
            await authService.verifyEmail(data.email, data.code);
            router.push("/login?verified=true");
        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed");
        }
    };

    return (
        <AuthCard 
            title="Verify Email"
            description="Please enter the verification code sent to your email"
            footer={
                <Button variant="link" onClick={() => router.push("/login")}>
                    Back to Login
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
                                        {...field} 
                                        readOnly={!!defaultEmail}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Verification Code</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Enter 6-digit code" 
                                        {...field}
                                        maxLength={6}
                                        pattern="[0-9]*"
                                        inputMode="numeric"
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
                        {form.formState.isSubmitting ? "Verifying..." : "Verify Email"}
                    </Button>
                </form>
            </Form>
        </AuthCard>
    );
} 