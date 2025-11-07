import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AlertSeverity } from '@metra/shared';

export function AlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { data: alerts } = useAlerts({ refetchInterval: 60000 });

  const activeAlerts = alerts?.filter((alert) => {
    if (alert.end_time) {
      return new Date(alert.end_time) > new Date();
    }
    return true;
  });

  const severeAlerts = activeAlerts?.filter(
    (alert) =>
      alert.severity === AlertSeverity.SEVERE ||
      alert.severity === AlertSeverity.WARNING
  );

  if (dismissed || !severeAlerts || severeAlerts.length === 0) {
    return null;
  }

  const topAlert = severeAlerts[0];

  return (
    <div className="sticky top-16 z-40">
      <Alert
        variant={
          topAlert.severity === AlertSeverity.SEVERE ? 'destructive' : 'default'
        }
        className="rounded-none border-x-0"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <span className="font-semibold">{topAlert.header}</span>
            {severeAlerts.length > 1 && (
              <span className="ml-2 text-xs">
                (+{severeAlerts.length - 1} more alerts)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/alerts')}
            >
              View All
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
