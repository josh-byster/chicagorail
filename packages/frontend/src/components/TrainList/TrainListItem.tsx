import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ArrowRight, MapPin } from 'lucide-react';
import type { Train } from '@metra/shared';

interface TrainListItemProps {
  train: Train;
}

export function TrainListItem({ train }: TrainListItemProps) {
  const departureTime = new Date(train.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const arrivalTime = new Date(train.arrival_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'text-green-600';
      case 'delayed':
        return 'text-orange-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string, delayMinutes: number) => {
    if (status === 'on_time') return 'On time';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'delayed' && delayMinutes > 0) {
      return `${delayMinutes} min delay`;
    }
    return status;
  };

  return (
    <Link to={`/train/${train.trip_id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Line indicator */}
              <div
                className="w-1 h-16 rounded-full"
                style={{ backgroundColor: train.line_id }}
                aria-label={`${train.line_name} line`}
              />

              {/* Time information */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{departureTime}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg">{arrivalTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{train.line_name}</span>
                  {train.train_number && (
                    <>
                      <span>•</span>
                      <span>Train #{train.train_number}</span>
                    </>
                  )}
                </div>

                {train.platform && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>Platform {train.platform}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="text-right">
              <span className={`text-sm font-medium ${getStatusColor(train.status)}`}>
                {getStatusText(train.status, train.delay_minutes)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
