import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, MapPin, Train as TrainIcon } from 'lucide-react';
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

  const getStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'on_time':
        return 'success';
      case 'delayed':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string, delayMinutes: number) => {
    if (status === 'on_time') return 'On Time';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'delayed' && delayMinutes > 0) {
      return `Delayed ${delayMinutes} min`;
    }
    return 'Scheduled';
  };

  return (
    <Link to={`/train/${train.trip_id}`} className="block">
      <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer group overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Line indicator with color */}
            <div
              className="w-2 flex-shrink-0"
              style={{ backgroundColor: train.line_id }}
              aria-label={`${train.line_name} line`}
            />

            <div className="flex-1 p-5">
              {/* Header with time and status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-2xl tracking-tight">{departureTime}</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    <span className="font-bold text-2xl tracking-tight text-muted-foreground">{arrivalTime}</span>
                  </div>
                </div>
                <Badge variant={getStatusVariant(train.status)} className="ml-3 flex-shrink-0">
                  {getStatusText(train.status, train.delay_minutes)}
                </Badge>
              </div>

              {/* Train details */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <TrainIcon className="h-4 w-4" />
                  <span>{train.line_name}</span>
                </div>

                {train.train_number && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Train #{train.train_number}</span>
                  </>
                )}

                {train.platform && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Platform {train.platform}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
