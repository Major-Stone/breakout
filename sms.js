#!/usr/bin/env node

"use strict";

const { execFile } = require("child_process");

function sendMessage(recipient, message) {
  return new Promise((resolve, reject) => {
    const escapedRecipient = recipient.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const escapedMessage = message.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const appleScript = `
tell application "Messages"
  set targetService to 1st service whose service type = SMS
  set targetBuddy to buddy "${escapedRecipient}" of targetService
  send "${escapedMessage}" to targetBuddy
end tell`;

    execFile("osascript", ["-e", appleScript], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(formatError(error, stderr)));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function formatError(error, stderr) {
  const msg = (stderr || error.message || "").toLowerCase();

  if (error.killed || error.signal === "SIGTERM") {
    return "Timed out waiting for Messages app to send. Is Messages running and signed in?";
  }
  if (msg.includes("not found") || msg.includes("can't get application")) {
    return "Messages app is not available. This tool requires macOS with the Messages app installed.";
  }
  if (msg.includes("buddy") && msg.includes("can't get")) {
    return `Recipient not found. Make sure "${arguments[0]}" is a valid phone number or Apple ID, and that the contact exists in Messages.`;
  }
  if (msg.includes("service") && msg.includes("can't get")) {
    return "No SMS service found. Ensure your iPhone is paired with this Mac via iCloud and Text Message Forwarding is enabled (Settings → Messages → Text Message Forwarding).";
  }
  return `AppleScript error: ${stderr || error.message}`;
}

function printUsage() {
  console.log("Usage: node sms.js <phone-number-or-apple-id> <message>");
  console.log("");
  console.log("Examples:");
  console.log('  node sms.js "+31612345678" "Hello from the CLI!"');
  console.log('  node sms.js "user@icloud.com" "Sent via iMessage"');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Error: Missing required arguments.\n");
    printUsage();
    process.exit(1);
  }

  const [recipient, message] = args;

  if (!recipient.trim()) {
    console.error("Error: Recipient cannot be empty.");
    process.exit(1);
  }

  if (!message.trim()) {
    console.error("Error: Message cannot be empty.");
    process.exit(1);
  }

  console.log(`Sending message to ${recipient}...`);

  try {
    await sendMessage(recipient, message);
    console.log("Message sent successfully.");
  } catch (err) {
    console.error(`Failed to send message: ${err.message}`);
    process.exit(1);
  }
}

main();
