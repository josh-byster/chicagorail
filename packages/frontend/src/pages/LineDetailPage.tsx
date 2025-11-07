import { ArrowLeft, MapPin, Accessibility, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchLine } from '../services/api';
import { useStations } from '../hooks/useStations';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function LineDetailPage() {
  const navigate = useNavigate();
  const { lineId } = useParams<{ lineId: string }>();

  const {
    data: line,
    isLoading: lineLoading,
    error: lineError,
  } = useQuery({
    queryKey: ['line', lineId],
    queryFn: () => fetchLine(lineId!),
    enabled: !!lineId,
  });

  const { data: allStations } = useStations();

  // Get stations for this line
  const lineStations = allStations?.filter((station) =>
    station.lines_served?.includes(lineId || '')
  );

  const isLoading = lineLoading;
  const error = lineError;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-sm border-b"
        style={{
          backgroundColor: line ? `#${line.line_color}20` : undefined,
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/lines')}
              aria-label="Back to lines"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {line && (
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                  style={{
                    backgroundColor: `#${line.line_color}`,
                    color: `#${line.line_text_color || 'ffffff'}`,
                  }}
                >
                  {line.line_short_name ||
                    line.line_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{line.line_name}</h1>
                  {line.description && (
                    <p className="text-sm text-muted-foreground">
                      {line.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load line details. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Stations List */}
        {!isLoading && !error && line && lineStations && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {lineStations.length} stations on this line
              </p>
              {line.line_url && (
                <Button variant="link" size="sm" asChild>
                  <a
                    href={line.line_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Schedule
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {lineStations.map((station, index) => (
                <Card
                  key={station.station_id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
                  onClick={() => {
                    // Navigate to home with this station pre-selected
                    navigate('/', {
                      state: { selectedStation: station.station_id },
                    });
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Station Number */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          backgroundColor: `#${line.line_color}`,
                          color: `#${line.line_text_color || 'ffffff'}`,
                        }}
                      >
                        {index + 1}
                      </div>

                      {/* Station Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-tight">
                          {station.station_name}
                        </h3>
                        {station.station_code && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Code: {station.station_code}
                          </p>
                        )}
                        {station.zone && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Zone {station.zone}
                          </Badge>
                        )}
                      </div>

                      {/* Accessibility & Other Lines */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {station.wheelchair_accessible && (
                          <Badge variant="secondary" className="text-xs">
                            <Accessibility className="h-3 w-3 mr-1" />
                            Accessible
                          </Badge>
                        )}
                        {station.lines_served &&
                          station.lines_served.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {station.lines_served.length} lines
                            </Badge>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
