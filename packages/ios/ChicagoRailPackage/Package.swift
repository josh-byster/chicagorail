// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ChicagoRailFeature",
    platforms: [.iOS(.v17)],
    products: [
        .library(
            name: "ChicagoRailFeature",
            targets: ["ChicagoRailFeature"]
        ),
        .library(
            name: "ChicagoRailShared",
            targets: ["ChicagoRailShared"]
        ),
    ],
    targets: [
        .target(
            name: "ChicagoRailShared"
        ),
        .target(
            name: "ChicagoRailFeature",
            dependencies: ["ChicagoRailShared"]
        ),
        .testTarget(
            name: "ChicagoRailFeatureTests",
            dependencies: ["ChicagoRailFeature"]
        ),
    ]
)
