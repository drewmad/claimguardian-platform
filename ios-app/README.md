# ClaimGuardian iOS App

A native iOS application for professional field damage assessment with advanced AR measurement capabilities, offline-first architecture, and AI-powered damage analysis.

## Overview

ClaimGuardian iOS is a comprehensive mobile solution designed for insurance adjusters, property owners, contractors, and public adjusters to conduct thorough property damage assessments using cutting-edge iOS technologies.

### Key Features

- **Advanced AR Measurements**: Precise distance, area, volume, and angle measurements using ARKit
- **Professional Camera System**: 4K photo/video capture with professional controls
- **AI-Powered Damage Analysis**: Real-time damage assessment using Vision framework and cloud AI
- **Offline-First Architecture**: Full functionality without internet connection
- **CloudKit Sync**: Seamless data synchronization across devices
- **Apple Ecosystem Integration**: Siri Shortcuts, Widgets, and Apple Pencil support

## Architecture

The app follows a clean, modular architecture built with SwiftUI and modern iOS patterns:

```
ClaimGuardian-iOS/
├── App/                    # App entry point and main views
├── Features/              # Feature modules
│   ├── Authentication/    # User authentication
│   ├── Dashboard/         # Main dashboard
│   ├── Assessment/        # Damage assessments
│   ├── Camera/           # Camera and photo capture
│   ├── ARMeasurement/    # AR measurement tools
│   └── Settings/         # App settings
├── Core/                 # Core services and utilities
│   ├── Data/            # Core Data models and CloudKit
│   ├── Network/         # Supabase integration
│   ├── Storage/         # Local storage and caching
│   └── Services/        # Business logic services
└── Resources/           # Assets and resources
```

## Technical Stack

### Core Technologies
- **SwiftUI**: Modern declarative UI framework
- **Combine**: Reactive programming for async operations
- **Core Data + CloudKit**: Offline-first data persistence with cloud sync
- **ARKit**: Augmented reality measurements and visualization
- **Vision Framework**: On-device image analysis and object detection
- **AVFoundation**: Professional camera controls and media processing

### External Dependencies
- **Supabase**: Backend as a service for data synchronization
- **AI Services**: OpenAI/Gemini integration for enhanced damage analysis

## Requirements

### Device Requirements
- iOS 15.0+
- ARKit compatible device (iPhone 6s/iPad Pro or newer)
- Camera with autofocus
- Minimum 64GB storage recommended

### Development Requirements
- Xcode 15.0+
- Swift 5.9+
- iOS 15.0 SDK
- Apple Developer Account

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/ClaimGuardian.git
cd ClaimGuardian/ios-app/ClaimGuardian-iOS
```

### 2. Configure Supabase
Update the following in `Info.plist`:
```xml
<key>SupabaseURL</key>
<string>https://your-project.supabase.co</string>
<key>SupabaseAPIKey</key>
<string>your-supabase-anon-key</string>
```

### 3. Apple Developer Setup

#### Capabilities Required:
- CloudKit
- Background App Refresh
- Push Notifications
- App Groups
- Keychain Sharing

#### Entitlements Setup:
1. Create CloudKit container: `iCloud.com.claimguardian.ios`
2. Create App Group: `group.com.claimguardian.ios`
3. Configure push notification certificates
4. Set up keychain access groups

### 4. Build Configuration
```bash
# Open in Xcode
open ClaimGuardian.xcodeproj

# Update Development Team ID in project settings
# Update Bundle Identifier: com.claimguardian.ios
```

## Core Features Implementation

### AR Measurement System

The AR measurement system provides professional-grade measurement capabilities:

```swift
// Example usage
let arController = ARMeasurementController()
await arController.startSession()

// Add measurement points
arController.addMeasurementPoint(at: screenLocation)

// Get measurement results
let measurements = arController.measurements
```

**Supported Measurements:**
- **Distance**: Point-to-point linear measurements
- **Area**: Polygon area calculation
- **Volume**: 3D volume estimation
- **Angle**: Three-point angle measurement

### AI Damage Analysis

Multi-tier analysis combining local and cloud AI:

```swift
let analysisService = AIAnalysisService.shared
let analysis = try await analysisService.analyzeDamage(
    image: capturedImage,
    assessmentContext: propertyContext
)

// Results include:
// - Damage categorization
// - Severity assessment
// - Cost estimation
// - Repair recommendations
```

**Analysis Pipeline:**
1. **Local Vision Analysis**: Object detection, text recognition, color analysis
2. **Local ML Models**: Damage classification and severity estimation
3. **Cloud Enhancement**: Advanced AI analysis with context
4. **Result Combination**: Confidence-weighted final assessment

### Offline-First Architecture

Comprehensive offline functionality with intelligent sync:

```swift
// All operations work offline
let assessment = Assessment(context: viewContext)
let photo = capturedPhoto
let measurement = arMeasurement

// Automatic sync when online
syncService.performSync()
```

**Offline Capabilities:**
- Create and edit assessments
- Capture and analyze photos
- Perform AR measurements
- Generate reports
- Data conflict resolution

### CloudKit Integration

Seamless data synchronization across devices:

- **Automatic Sync**: Background synchronization when network is available
- **Conflict Resolution**: Intelligent merging of conflicting changes
- **Selective Sync**: Efficient bandwidth usage with selective data sync
- **Privacy**: End-to-end encryption for sensitive data

## Performance Optimization

### Memory Management
- **Lazy Loading**: Progressive loading of large images and data
- **Image Compression**: Intelligent compression based on usage context
- **Cache Management**: LRU cache for frequently accessed data
- **Background Processing**: Heavy operations on background queues

### Battery Optimization
- **Efficient AR**: Optimized ARKit usage with automatic pausing
- **Background Tasks**: Minimal background processing
- **Network Batching**: Batch sync operations to reduce radio usage
- **Adaptive Quality**: Dynamic quality adjustment based on battery level

### Storage Management
- **Core Data Optimization**: Efficient queries and fetch requests
- **Photo Management**: Thumbnail generation and progressive loading
- **Cleanup Strategies**: Automatic cleanup of old temporary files
- **Compression**: Lossless compression for archival data

## Security & Privacy

### Data Protection
- **Keychain Storage**: Secure credential and token storage
- **Data Encryption**: Core Data encryption at rest
- **Network Security**: Certificate pinning and secure transmission
- **Privacy Controls**: Granular permission management

### Compliance
- **GDPR Ready**: Data portability and deletion capabilities
- **CCPA Compliance**: Privacy policy and opt-out mechanisms
- **HIPAA Considerations**: Secure handling of sensitive information
- **Insurance Regulations**: Compliance with industry standards

## Testing Strategy

### Unit Tests
```bash
# Run unit tests
xcodebuild test -scheme ClaimGuardian -destination 'platform=iOS Simulator,name=iPhone 14'
```

### Integration Tests
- Supabase API integration
- CloudKit synchronization
- AR measurement accuracy
- AI analysis pipeline

### UI Tests
- Critical user workflows
- Accessibility compliance
- Performance benchmarks
- Memory leak detection

### Performance Tests
```swift
// Example performance test
func testARMeasurementPerformance() {
    measure {
        // AR measurement operations
    }
}
```

## Deployment

### App Store Configuration

#### App Store Connect Setup:
1. **App Information**:
   - Name: ClaimGuardian
   - Category: Business
   - Content Rating: 4+

2. **App Description**:
```
Professional damage assessment tool for insurance industry professionals.
Features advanced AR measurements, AI-powered damage analysis, and offline-first architecture.

Key Features:
• Precise AR measurements (distance, area, volume, angle)
• AI-powered damage detection and cost estimation
• Professional 4K photo and video capture
• Offline functionality with cloud synchronization
• Apple Pencil support for detailed annotations
• Siri Shortcuts for voice-activated assessments
```

3. **Keywords**:
```
insurance, damage assessment, AR measurement, property inspection, claim documentation, field assessment, construction, real estate, adjuster, contractor
```

#### Screenshots Required:
- iPhone 6.7": 1290×2796 pixels (5 screenshots)
- iPhone 6.5": 1242×2688 pixels (5 screenshots)
- iPad Pro 12.9": 2048×2732 pixels (5 screenshots)

### Build & Distribution

#### TestFlight Distribution:
```bash
# Archive build
xcodebuild -scheme ClaimGuardian -archivePath ClaimGuardian.xcarchive archive

# Export for distribution
xcodebuild -exportArchive -archivePath ClaimGuardian.xcarchive -exportPath ./Export -exportOptionsPlist ExportOptions.plist
```

#### App Store Submission:
1. Upload build via Xcode or Application Loader
2. Complete App Store Connect metadata
3. Submit for review
4. Monitor review status

### Release Management

#### Version Numbering:
- **Major.Minor.Patch** (e.g., 1.2.3)
- **Build Number**: Increment for each build

#### Release Notes Template:
```
Version 1.1.0 - Enhanced AR Measurements

New Features:
• Improved AR measurement accuracy
• New volume measurement mode
• Apple Pencil annotation support

Improvements:
• Faster AI analysis processing
• Enhanced offline sync reliability
• Better battery optimization

Bug Fixes:
• Fixed camera focus issues
• Resolved sync conflicts
• Improved stability
```

## Monitoring & Analytics

### Performance Monitoring
- **App Launch Time**: Target <3 seconds
- **Memory Usage**: Monitor for memory leaks
- **Crash Rate**: Target <0.1% crash-free sessions
- **Network Performance**: API response times

### Usage Analytics
- **Feature Adoption**: Track feature usage patterns
- **User Flow**: Analyze user journey through app
- **Performance Metrics**: AR session duration, analysis accuracy
- **Error Tracking**: Categorize and prioritize issues

### Crash Reporting
```swift
// Example crash reporting integration
import CrashReporting

func setupCrashReporting() {
    CrashReporter.configure()
    CrashReporter.setUserIdentifier(currentUser.id)
}
```

## Troubleshooting

### Common Issues

#### AR Not Working:
- Check device ARKit compatibility
- Verify camera permissions
- Ensure adequate lighting
- Reset tracking if needed

#### Sync Issues:
- Check network connectivity
- Verify Supabase configuration
- Review CloudKit container setup
- Check authentication status

#### Camera Problems:
- Verify camera permissions
- Check available storage space
- Restart camera session
- Update device software

#### Performance Issues:
- Monitor memory usage
- Check background app refresh
- Clear local cache
- Restart application

### Debug Mode
```swift
#if DEBUG
    print("Debug info: \(debugData)")
#endif
```

### Logging
```swift
import os.log

let logger = Logger(subsystem: "com.claimguardian.ios", category: "network")
logger.info("API request started")
```

## Contributing

### Development Setup
1. Fork repository
2. Create feature branch
3. Follow coding standards
4. Add comprehensive tests
5. Submit pull request

### Code Style
- Follow Swift API Design Guidelines
- Use SwiftLint for consistency
- Document public APIs
- Write unit tests for new features

### Git Workflow
```bash
git checkout -b feature/new-measurement-tool
git commit -m "Add: New AR measurement tool for angles"
git push origin feature/new-measurement-tool
```

## Support

### Documentation
- [API Reference](docs/api-reference.md)
- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)

### Community
- GitHub Issues for bug reports
- Discussions for feature requests
- Discord for developer chat

### Enterprise Support
For enterprise customers:
- Priority support channel
- Custom integration assistance
- Training and onboarding
- SLA guarantees

## License

Copyright © 2025 ClaimGuardian. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

---

## Roadmap

### Version 1.1 (Q1 2025)
- [ ] Apple Watch companion app
- [ ] Advanced ML models
- [ ] Batch processing improvements
- [ ] Enhanced reporting features

### Version 1.2 (Q2 2025)
- [ ] iPad Pro optimization
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with popular CRM systems

### Version 2.0 (Q3 2025)
- [ ] Vision Pro support
- [ ] Real-time collaboration
- [ ] Advanced AI recommendations
- [ ] Workflow automation

---

For questions, support, or enterprise inquiries, contact: [ios-support@claimguardian.ai](mailto:ios-support@claimguardian.ai)
