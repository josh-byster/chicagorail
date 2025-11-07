import { ArrowLeft, Train } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLines } from '../hooks/useLines';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function LinesPage() {
  const navigate = useNavigate();
  const { data: lines, isLoading, error } = useLines();

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
              <Train className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Metra Lines</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load lines. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Lines Grid */}
        {!isLoading && !error && lines && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Explore all {lines.length} Metra rail lines
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lines.map((line) => (
                <Card
                  key={line.line_id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4"
                  style={{ borderLeftColor: `#${line.line_color}` }}
                  onClick={() => navigate(`/lines/${line.line_id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
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
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight">
                          {line.line_name}
                        </CardTitle>
                        {line.description && (
                          <CardDescription className="mt-1 text-xs line-clamp-2">
                            {line.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {line.stations?.length || 0} stations
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lines/${line.line_id}`);
                        }}
                      >
                        View Details →
                      </Button>
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
