
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface CheckInHeaderProps {
  children: ReactNode;
}

export function CheckInHeader({ children }: CheckInHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where are you now?</CardTitle>
        <CardDescription>
          Log your visit and earn badges for the places you go
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
