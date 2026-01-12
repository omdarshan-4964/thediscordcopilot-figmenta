require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '!ping') {
        try {
            // Fetch system instructions
            const { data, error } = await supabase
                .from('system_instructions')
                .select('content')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('Supabase error:', error);
                message.reply('Pong! 🏴‍☠️ (Could not fetch instructions)');
                return;
            }

            const instruction = data?.content || 'No instructions found.';
            message.reply(`Pong! 🏴‍☠️ My current instruction is: ${instruction}`);

        } catch (err) {
            console.error('Unexpected error:', err);
            message.reply('Pong! 🏴‍☠️ (An error occurred)');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
