import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { SavedRoute } from "@metra/shared"

export function SavedRouteCard({
  route,
  originStationName,
  destinationStationName,
  nextTrainTime,
  isLoading,
  isError,
  onClick,
  onDelete,
}: {
  route: SavedRoute
  originStationName: string
  destinationStationName: string
  nextTrainTime?: string
  isLoading?: boolean
  isError?: boolean
  onClick: () => void
  onDelete: () => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <CardHeader className="pb-2" onClick={onClick}>
        <CardTitle className="text-lg font-medium">{route.label}</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2" onClick={onClick}>
        <div className="text-sm text-muted-foreground">
          {originStationName} → {destinationStationName}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between text-sm" onClick={onClick}>
        {isLoading ? (
          <span className="text-muted-foreground">Loading...</span>
        ) : isError ? (
          <span className="text-destructive">Error loading train time</span>
        ) : nextTrainTime ? (
          <span className="font-medium">Next: {nextTrainTime}</span>
        ) : (
          <span className="text-muted-foreground">No upcoming trains</span>
        )}
        <span className="text-muted-foreground">
          Used {route.use_count} {route.use_count === 1 ? 'time' : 'times'}
        </span>
      </CardFooter>
    </Card>
  )
}
