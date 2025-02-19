import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage, NewMessageEvent } from "telegram/events/index.js";
import { createInterface } from "readline";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    "SOURCE_API_ID",
    "SOURCE_API_HASH",
    "SOURCE_CHANNEL_ID",
    "TARGET_CHANNEL_ID"
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Parse optional configuration
const requiredKeywords = process.env.REQUIRED_KEYWORDS?.split(",").map(k => k.trim().toLowerCase()) || [];
const optionalKeywords = process.env.OPTIONAL_KEYWORDS?.split(",").map(k => k.trim().toLowerCase()) || [];
const minMessageLength = parseInt(process.env.MIN_MESSAGE_LENGTH || "0", 10);

// Function to check if a message should be forwarded
function shouldForwardMessage(text: string): boolean {
    // Skip empty messages
    if (!text) return false;

    // Check minimum length
    if (text.length < minMessageLength) return false;

    const lowerText = text.toLowerCase();

    // Check required keywords - must find ALL of them
    if (requiredKeywords.length > 0) {
        const hasAllRequired = requiredKeywords.every(keyword => lowerText.includes(keyword));
        if (!hasAllRequired) return false;
    }

    // Check optional keywords - must find at least ONE of them
    if (optionalKeywords.length > 0) {
        const hasOneOptional = optionalKeywords.some(keyword => lowerText.includes(keyword));
        if (!hasOneOptional) return false;
    }

    // If we got here, either:
    // 1. There were no keywords specified
    // 2. All required keywords were found AND (no optional keywords were specified OR at least one optional keyword was found)
    return true;
}

// Function to handle message forwarding
async function handleMessage(event: NewMessageEvent) {
    try {
        const message = event.message;
        const client = event.client;

        // Check if we have all required data
        if (!client || !message.chatId) {
            console.log("Missing required message data");
            return;
        }

        // Check if the message is from the source channel
        if (message.chatId.toString() !== process.env.SOURCE_CHANNEL_ID) {
            return;
        }

        // Get message text
        const text = message.text || message.message || "";

        // Check if message should be forwarded
        if (!shouldForwardMessage(text)) {
            console.log("Message filtered out:", text.substring(0, 50) + "...");
            return;
        }

        // Forward the message using the same client
        await client.sendMessage(
            process.env.TARGET_CHANNEL_ID!,
            {
                message: text
            }
        )

        console.log("Message forwarded successfully!");
    } catch (error) {
        console.error("Error processing message:", error);
    }
}

// Start the client
async function startClient() {
    try {
        // Initialize the client (user account)
        const client = new TelegramClient(
            new StringSession(process.env.SOURCE_SESSION_STRING || ""),
            parseInt(process.env.SOURCE_API_ID!),
            process.env.SOURCE_API_HASH!,
            { connectionRetries: 5 }
        );

        // Start the client
        await client.connect();
        
        // Check if we need to log in
        if (!await client.isUserAuthorized()) {
            console.log("You need to login first!");
            const phoneNumber = await askQuestion("Please enter your phone number: ");
            await client.start({
                phoneNumber: async () => phoneNumber,
                password: async () => await askQuestion("Please enter your 2FA password (if any): "),
                phoneCode: async () => await askQuestion("Please enter the code you received: "),
                onError: (err) => console.error("Client error:", err),
            });
            
            // Save the session string
            const sessionString = client.session.save();
            console.log("\n=== IMPORTANT ===");
            console.log("Please save this session string in your .env file as SOURCE_SESSION_STRING:");
            console.log(sessionString);
            console.log("=== END ===\n");
        }

        console.log("Client started successfully!");
        console.log("Monitoring channel:", process.env.SOURCE_CHANNEL_ID);
        console.log("Will forward to channel:", process.env.TARGET_CHANNEL_ID);

        // Add event handler for new messages
        client.addEventHandler(handleMessage, new NewMessage({}));

        if (requiredKeywords.length > 0 || optionalKeywords.length > 0) {
            console.log("Filtering for keywords:", requiredKeywords.join(", "), "AND", optionalKeywords.join(", "));
        }
        if (minMessageLength > 0) {
            console.log("Minimum message length:", minMessageLength);
        }
    } catch (error) {
        console.error("Error starting client:", error);
        process.exit(1);
    }
}

// Helper function to ask questions in console
function askQuestion(question: string): Promise<string> {
    const readline = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question(question, (answer: string) => {
            readline.close();
            resolve(answer);
        });
    });
}

// Start the client
startClient(); 