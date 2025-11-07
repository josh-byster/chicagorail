import {
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { ServiceAlert, AlertType, AlertSeverity } from '@metra/shared';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: ServiceAlert;
  lines?: { line_id: string; line_name: string; line_color: string }[];
}

const alertTypeConfig: Record<AlertType, { label: string; icon: typeof Info }> =
  {
    delay: { label: 'Delay', icon: Clock },
    cancellation: { label: 'Cancellation', icon: AlertCircle },
    detour: { label: 'Detour', icon: AlertTriangle },
    schedule_change: { label: 'Schedule Change', icon: Info },
    construction: { label: 'Construction', icon: AlertTriangle },
    weather: { label: 'Weather', icon: AlertCircle },
    incident: { label: 'Incident', icon: AlertCircle },
    information: { label: 'Information', icon: Info },
  };

const severityConfig: Record<
  AlertSeverity,
  { variant: 'default' | 'destructive' | 'secondary'; className: string }
> = {
  info: {
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  warning: {
    variant: 'default',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  severe: {
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

export function AlertCard({ alert, lines }: AlertCardProps) {
  const typeConfig = alertTypeConfig[alert.alert_type];
  const severityStyle = severityConfig[alert.severity];
  const Icon = typeConfig.icon;

  const affectedLines = lines?.filter((line) =>
    alert.affected_lines?.includes(line.line_id)
  );

  const startTime = new Date(alert.start_time);
  const timeAgo = formatDistanceToNow(startTime, { addSuffix: true });

  return (
    <Card className={`border-l-4 ${severityStyle.className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">
                {alert.header}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {timeAgo}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge className={severityStyle.className}>
              {alert.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {alert.description}
        </p>

        {affectedLines && affectedLines.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Affected Lines:
            </p>
            <div className="flex flex-wrap gap-2">
              {affectedLines.map((line) => (
                <Badge
                  key={line.line_id}
                  className="font-medium"
                  style={{
                    backgroundColor: `#${line.line_color}`,
                    color: '#ffffff',
                  }}
                >
                  {line.line_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {alert.end_time && (
          <p className="text-xs text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            Expected to resolve:{' '}
            {formatDistanceToNow(new Date(alert.end_time), { addSuffix: true })}
          </p>
        )}

        {alert.url && (
          <Button variant="link" className="p-0 h-auto" asChild>
            <a
              href={alert.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
            >
              More information
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
