/**
 * @fileMetadata
 * @purpose "Depreciation alerts component for personal property"
 * @dependencies ["@/components","@/lib","lucide-react"]
 * @owner frontend-team
 * @status stable
 */
"use client";

import {
  AlertCircle,
  Calendar,
  DollarSign,
  Info,
  TrendingDown,
  Wrench,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DepreciationAlert } from "@/lib/depreciation";

interface DepreciationAlertsProps {
  alerts: DepreciationAlert[];
  onDismiss?: (alert: DepreciationAlert) => void;
  onAction?: (alert: DepreciationAlert) => void;
}

export function DepreciationAlerts({
  alerts,
  onDismiss,
  onAction,
}: DepreciationAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: DepreciationAlert["type"]) => {
    switch (type) {
      case "maintenance":
        return Wrench;
      case "replacement":
        return TrendingDown;
      case "value-threshold":
        return DollarSign;
      default:
        return Info;
    }
  };

  const getAlertColor = (severity: DepreciationAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "default"; // Using default since warning variant doesn't exist
      case "info":
      default:
        return "default";
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          Property Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = getAlertIcon(alert.type);
          const color = getAlertColor(alert.severity);

          return (
            <Alert
              key={index}
              variant={color}
              className="bg-gray-900 border-gray-700"
            >
              <Icon className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                {alert.title}
                {alert.dueDate && (
                  <Badge variant="outline" className="ml-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    Due: {alert.dueDate.toLocaleDateString()}
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>{alert.description}</p>
                {alert.actionRequired && (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-medium">
                      {alert.actionRequired}
                    </span>
                    <div className="flex gap-2">
                      {onAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAction(alert)}
                          className="bg-gray-800 hover:bg-gray-700"
                        >
                          Take Action
                        </Button>
                      )}
                      {onDismiss && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDismiss(alert)}
                          className="hover:bg-gray-800"
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
