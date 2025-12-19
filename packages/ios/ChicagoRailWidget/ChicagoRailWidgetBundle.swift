import SwiftUI
import WidgetKit

@main
struct ChicagoRailWidgetBundle: WidgetBundle {
    var body: some Widget {
        DepartureWidget()
        TrainTrackingLiveActivity()
    }
}
