import { useState } from 'react';
import { ArrowLeft, Bell, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { useLines } from '../hooks/useLines';
import { AlertCard } from '../components/AlertCard';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { AlertSeverity } from '@metra/shared';

export default function AlertsPage() {
  const navigate = useNavigate();
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const {
    data: alerts,
    isLoading,
    error,
  } = useAlerts({
    lineId: selectedLine !== 'all' ? selectedLine : undefined,
  });

  const { data: lines } = useLines();

  // Filter by severity on client side
  const filteredAlerts = alerts?.filter((alert) => {
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) {
      return false;
    }
    return true;
  });

  const activeAlerts = filteredAlerts?.filter((alert) => {
    if (alert.end_time) {
      return new Date(alert.end_time) > new Date();
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Service Alerts</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter Alerts</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Line</label>
              <Select value={selectedLine} onValueChange={setSelectedLine}>
                <SelectTrigger>
                  <SelectValue placeholder="All Lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {lines?.map((line) => (
                    <SelectItem key={line.line_id} value={line.line_id}>
                      {line.line_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select
                value={selectedSeverity}
                onValueChange={setSelectedSeverity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value={AlertSeverity.SEVERE}>Severe</SelectItem>
                  <SelectItem value={AlertSeverity.WARNING}>Warning</SelectItem>
                  <SelectItem value={AlertSeverity.INFO}>Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load alerts. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerts List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {activeAlerts && activeAlerts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {activeAlerts.length} active alert
                    {activeAlerts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {activeAlerts.map((alert) => (
                  <AlertCard key={alert.alert_id} alert={alert} lines={lines} />
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground">
                  All systems are currently operating normally.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
