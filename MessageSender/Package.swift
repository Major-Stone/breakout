// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "MessageSender",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "MessageSender",
            path: "Sources/MessageSender",
            swiftSettings: [
                .unsafeFlags(["-parse-as-library"])
            ]
        )
    ]
)
