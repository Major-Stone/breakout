# MessageSender — macOS SMS/iMessage App

A native SwiftUI macOS app for sending SMS and iMessage via the Messages app.

## Prerequisites

1. **macOS 13 (Ventura)** or later
2. **Xcode Command Line Tools** — install with `xcode-select --install`
3. **iPhone paired with your Mac** via iCloud (for SMS)
4. **Text Message Forwarding** enabled on your iPhone:
   - Go to **Settings → Messages → Text Message Forwarding**
   - Toggle on your Mac in the device list
5. **Messages app** signed in to your iCloud account

## Build & Run

### Quick start (development)

```bash
cd MessageSender
swift build
.build/debug/MessageSender
```

### Create an app bundle (release)

```bash
cd MessageSender
chmod +x bundle.sh
./bundle.sh
open MessageSender.app
```

## Usage

1. Enter a phone number (e.g. `+31612345678`) or Apple ID email
2. Type your message
3. Click **Send** or press **Cmd+Return**
4. The message status appears in the history below

## Permissions

On first send, macOS will ask you to grant MessageSender permission to control the Messages app. Go to **System Settings → Privacy & Security → Automation** and enable Messages for MessageSender.

## Troubleshooting

| Error | Solution |
|-------|----------|
| No SMS service found | Ensure your iPhone is paired via iCloud and Text Message Forwarding is on |
| Recipient not found | Check the phone number or Apple ID is correct |
| Messages not available | Make sure the Messages app is installed and you are signed in |
| Timed out | Check that Messages is running and signed in to iCloud |
| Permission denied | Go to System Settings → Privacy & Security → Automation and allow MessageSender |

## Data Storage

Message history is stored at:
```
~/Library/Application Support/MessageSender/history.json
```
