# CG Schedule Bot

A Discord bot for automatically scheduling worship service roles for Cell Group meetings.

## Features

- **Automated Role Assignment**: Assigns 4 roles each Friday (Presider, Devotion Leader, Opening Prayer, Closing Prayer)
- **Smart Scheduling**: Prevents conflicts and ensures fair rotation
- **Discord Commands**: Easy-to-use commands for viewing schedules
- **Persistent Schedules**: Consistent scheduling across requests

## Commands

- `!schedule` - Show current month schedule
- `!schedule [month]` - Show specific month schedule  
- `!schedule [month] [year]` - Show specific month/year schedule

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Discord bot token:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ```
4. Run the bot: `node index.js`

## Deployment

This bot can be deployed to various cloud platforms:
- Railway
- Render
- Heroku
- DigitalOcean
- And more!

## Members

The bot manages scheduling for a predefined list of members and handles special cases like new members joining for specific roles.

## License

ISC
