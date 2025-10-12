import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SavedRoute } from "@metra/shared"

// Generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface SaveRouteDialogProps {
  originStationId: string
  destinationStationId: string
  originStationName: string
  destinationStationName: string
  onSave: (route: SavedRoute) => void
  children: React.ReactNode
}

export function SaveRouteDialog({
  originStationId,
  destinationStationId,
  originStationName,
  destinationStationName,
  onSave,
  children,
}: SaveRouteDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [routeLabel, setRouteLabel] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!routeLabel.trim()) {
      return
    }
    
    const now = new Date().toISOString();
    const newRoute: SavedRoute = {
      route_id: generateUUID(),
      origin_station_id: originStationId,
      destination_station_id: destinationStationId,
      label: routeLabel.trim(),
      created_at: now,
      last_used_at: now,
      use_count: 1,
    }
    
    onSave(newRoute)
    setRouteLabel("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Route</DialogTitle>
          <DialogDescription>
            Save this route for quick access later. You can customize the label.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="origin" className="text-right">
                From
              </Label>
              <div className="col-span-3">
                <Input
                  id="origin"
                  value={originStationName}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destination" className="text-right">
                To
              </Label>
              <div className="col-span-3">
                <Input
                  id="destination"
                  value={destinationStationName}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <div className="col-span-3">
                <Input
                  id="label"
                  value={routeLabel}
                  onChange={(e) => setRouteLabel(e.target.value)}
                  placeholder="e.g., Work commute, Weekend trips"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!routeLabel.trim()}>
              Save Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
