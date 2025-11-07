import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRecentSearches, clearRecentSearches } from '@/services/storage';
import { formatDistanceToNow } from 'date-fns';

export function RecentSearches() {
  const navigate = useNavigate();

  const { data: recentSearches, refetch } = useQuery({
    queryKey: ['recentSearches'],
    queryFn: getRecentSearches,
  });

  const handleSearchClick = (originId: string, destinationId: string) => {
    navigate(`/route?origin=${originId}&destination=${destinationId}`);
  };

  const handleClearAll = async () => {
    await clearRecentSearches();
    refetch();
  };

  if (!recentSearches || recentSearches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Searches
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {recentSearches.map((search) => (
          <Card
            key={search.search_id}
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] group"
            onClick={() =>
              handleSearchClick(
                search.origin_station_id,
                search.destination_station_id
              )
            }
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {search.origin_station_name}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm truncate">
                      {search.destination_station_name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(search.searched_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
