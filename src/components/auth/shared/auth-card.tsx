import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ReactNode } from "react";

interface AuthCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
    return (
        <Card className="w-[400px]">
            <CardHeader>
                <h2 className="text-2xl font-bold text-center">{title}</h2>
                {description && (
                    <p className="text-center text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer && <CardFooter className="flex justify-center">{footer}</CardFooter>}
        </Card>
    );
} 