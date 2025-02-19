# Telegram Channel Copy Bot

A TypeScript bot that monitors a Telegram channel and forwards selected messages to another channel based on configurable criteria.

## Features

- Monitor a source channel for new messages
- Forward messages to a target channel
- Filter messages based on keywords
- Filter messages based on minimum length
- Support for text messages and messages with captions

## Prerequisites

- Node.js (v14 or higher)
- A Telegram Bot Token (get it from [@BotFather](https://t.me/BotFather))
- Channel IDs for source and target channels
- The bot must be an admin in both channels

## Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your configuration:
   - `BOT_TOKEN`: Your Telegram bot token
   - `SOURCE_CHANNEL_ID`: ID of the channel to monitor (with minus sign)
   - `TARGET_CHANNEL_ID`: ID of the channel to forward messages to (with minus sign)
   - `KEYWORDS`: Optional comma-separated keywords to filter messages
   - `MIN_MESSAGE_LENGTH`: Optional minimum message length

## Running the Bot

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Getting Channel IDs

1. Forward a message from your channel to [@getidsbot](https://t.me/getidsbot)
2. The bot will show you the channel ID (it should start with -100)
3. Use these IDs in your .env file

## Adding the Bot to Channels

1. Create a new bot with [@BotFather](https://t.me/BotFather)
2. Add the bot as an administrator to both source and target channels
3. Required permissions:
   - Read messages (for source channel)
   - Send messages (for target channel)

## License

ISC 