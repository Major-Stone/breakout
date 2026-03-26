# macOS SMS/iMessage CLI

A command-line tool that sends SMS or iMessage using the macOS Messages app via AppleScript.

## Prerequisites

1. **macOS** with the Messages app installed
2. **iPhone paired with your Mac** via iCloud (for SMS)
3. **Text Message Forwarding enabled** on your iPhone:
   - Go to **Settings → Messages → Text Message Forwarding**
   - Toggle on your Mac in the device list
4. **Node.js** installed (v12 or later)

## Usage

```bash
node sms.js <phone-number-or-apple-id> <message>
```

### Examples

```bash
# Send an SMS to a phone number
node sms.js "+31612345678" "Hello from the CLI!"

# Send an iMessage to an Apple ID
node sms.js "user@icloud.com" "Sent via iMessage"
```

## How it works

The tool uses `osascript` to execute AppleScript that controls the macOS Messages app. It:

1. Opens a connection to the Messages app
2. Finds the SMS service
3. Locates the recipient as a buddy
4. Sends the message
5. Waits for confirmation before exiting

## Troubleshooting

| Error | Solution |
|-------|----------|
| No SMS service found | Ensure your iPhone is paired via iCloud and Text Message Forwarding is enabled |
| Recipient not found | Verify the phone number or Apple ID is correct and the contact exists in Messages |
| Messages app not available | Make sure you are running macOS with the Messages app installed |
| Timed out | Check that Messages is running and you are signed in to iCloud |
