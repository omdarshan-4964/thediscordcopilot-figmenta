require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignore bots
    if (message.author.bot) return;

    console.log('Received message:', message.content);

    try {
        // Step A: Fetch system_instructions (ID 1) from Supabase
        const { data, error } = await supabase
            .from('system_instructions')
            .select('content')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw new Error('Failed to fetch system instructions');
        }

        const systemInstruction = data?.content || 'You are a helpful assistant.';
        console.log('System instruction fetched');

        // Step B: Create the prompt
        // Using chat format for better context handling if we expanded, but currently single turn as requested
        const prompt = `System: ${systemInstruction}\nUser: ${message.content}`;

        // Step C: Call model.generateContent
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini response received');

        // Step D: Send result back to Discord
        // Split message if too long (Discord limit is 2000)
        if (text.length > 2000) {
            const chunks = text.match(/[\s\S]{1,2000}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(text);
        }

    } catch (err) {
        console.error('Error processing message:', err);
        message.reply('⚠️ Brain freeze! I encountered an error.');
    }
});

client.login(process.env.DISCORD_TOKEN);
