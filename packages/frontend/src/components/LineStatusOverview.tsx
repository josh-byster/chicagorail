import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLines } from '@/hooks/useLines';
import { useAlerts } from '@/hooks/useAlerts';

export function LineStatusOverview() {
  const navigate = useNavigate();
  const { data: lines, isLoading: linesLoading } = useLines();
  const { data: alerts, isLoading: alertsLoading } = useAlerts({
    refetchInterval: 60000,
  });

  const isLoading = linesLoading || alertsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Line Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get active alerts
  const activeAlerts =
    alerts?.filter((alert) => {
      if (alert.end_time) {
        return new Date(alert.end_time) > new Date();
      }
      return true;
    }) || [];

  // Count alerts per line
  const lineAlertCounts = new Map<string, number>();
  activeAlerts.forEach((alert) => {
    alert.affected_lines?.forEach((line) => {
      lineAlertCounts.set(line, (lineAlertCounts.get(line) || 0) + 1);
    });
  });

  // Get lines with most alerts (top 3)
  const linesWithAlerts = lines
    ?.map((line) => ({
      ...line,
      alertCount: lineAlertCounts.get(line.line_id) || 0,
    }))
    .sort((a, b) => b.alertCount - a.alertCount)
    .slice(0, 5);

  const totalAlerts = activeAlerts.length;
  const severeAlerts = activeAlerts.filter(
    (a) => a.severity === 'severe'
  ).length;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={() => navigate('/alerts')}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Line Status
          </div>
          {totalAlerts > 0 ? (
            <Badge variant={severeAlerts > 0 ? 'destructive' : 'warning'}>
              {totalAlerts} {totalAlerts === 1 ? 'Alert' : 'Alerts'}
            </Badge>
          ) : (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              All Clear
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalAlerts > 0 ? (
          <div className="space-y-2">
            {linesWithAlerts?.map((line) => (
              <div
                key={line.line_id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-8 rounded-full"
                    style={{ backgroundColor: line.line_color || '#000' }}
                  />
                  <span className="text-sm font-medium">
                    {line.line_short_name}
                  </span>
                </div>
                {line.alertCount > 0 ? (
                  <Badge variant="warning" className="text-xs">
                    {line.alertCount}
                  </Badge>
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-sm font-medium">All Lines Operating Normally</p>
            <p className="text-xs text-muted-foreground mt-1">
              No service alerts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
