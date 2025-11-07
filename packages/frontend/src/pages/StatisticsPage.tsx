import { ArrowLeft, TrendingUp, MapPin, Train, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStatistics } from '../hooks/useStatistics';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export default function StatisticsPage() {
  const navigate = useNavigate();
  const { statistics, isLoading } = useStatistics();

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
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Your Statistics</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        )}

        {/* No Data State */}
        {!isLoading && !statistics && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Statistics Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start saving routes to see your travel insights and patterns.
            </p>
            <Button onClick={() => navigate('/')}>Find Trains</Button>
          </div>
        )}

        {/* Statistics Display */}
        {!isLoading && statistics && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Trips</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statistics.totalTrips}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {statistics.totalRoutes} saved routes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Days Active</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statistics.daysSinceFirst}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Since your first route
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Recent Activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statistics.recentActivity}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Routes used in last 7 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Most Used Route */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Most Used Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">
                      {statistics.mostUsedRoute.originStation?.station_name ||
                        'Unknown'}{' '}
                      →{' '}
                      {statistics.mostUsedRoute.destinationStation
                        ?.station_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {statistics.mostUsedRoute.label}
                    </p>
                  </div>
                  <Badge className="text-lg px-4 py-2">
                    {statistics.mostUsedRoute.use_count} trips
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Top Stations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top Stations
                </CardTitle>
                <CardDescription>
                  Your most frequently used stations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.topStations.map((item, index) => (
                    <div
                      key={item.station?.station_id || index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {item.station?.station_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.station?.lines_served?.length || 0} lines
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{item.count} trips</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Lines */}
            {statistics.topLines.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Train className="h-5 w-5" />
                    Most Used Lines
                  </CardTitle>
                  <CardDescription>
                    Lines you travel on most often
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.topLines.map((item, index) => (
                      <div
                        key={item.line?.line_id || index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                            style={{
                              backgroundColor: item.line
                                ? `#${item.line.line_color}`
                                : '#ccc',
                              color: item.line
                                ? `#${item.line.line_text_color || 'ffffff'}`
                                : '#000',
                            }}
                          >
                            {item.line?.line_short_name ||
                              item.line?.line_name
                                .substring(0, 2)
                                .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {item.line?.line_name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{item.count} trips</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity by Day of Week */}
            {statistics.activityByDay.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Activity by Day
                  </CardTitle>
                  <CardDescription>When you travel most often</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.activityByDay.slice(0, 5).map((item) => {
                      const maxCount = statistics.activityByDay[0]?.count || 1;
                      const percentage = (item.count / maxCount) * 100;

                      return (
                        <div key={item.day} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.day}</span>
                            <span className="text-muted-foreground">
                              {item.count} trips
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
