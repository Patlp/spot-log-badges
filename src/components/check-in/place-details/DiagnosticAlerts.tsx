
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DiagnosticAlertsProps {
  submitError: string | null;
  diagnosticInfo: string | null;
}

export function DiagnosticAlerts({ submitError, diagnosticInfo }: DiagnosticAlertsProps) {
  return (
    <>
      {submitError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      {diagnosticInfo && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-700">
            Diagnostic: {diagnosticInfo}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
