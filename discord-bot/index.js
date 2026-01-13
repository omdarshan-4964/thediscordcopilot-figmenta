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
        // Step 0: Check Allow-list
        const outputChannelId = message.channel.id;
        console.log(`Checking channel: ${outputChannelId}...`);

        const { data: channelData, error: channelError } = await supabase
            .from('allowed_channels')
            .select('channel_id')
            .eq('channel_id', outputChannelId)
            .single();

        if (channelError && channelError.code !== 'PGRST116') {
            console.error('Error checking allowed_channels:', channelError);
            // Continue or stop? Safety first: stop if DB error? 
            // Logic says: If NO row found => Stop.
            // If DB error => maybe log and stop to be safe.
            return;
        }

        if (!channelData) {
            console.log(`Checking channel: ${outputChannelId}... Allowed? No`);
            return; // STOP: Channel not allowed
        }

        console.log(`Checking channel: ${outputChannelId}... Allowed? Yes`);

        // Step A: Fetch system_instructions (ID 1) from Supabase
        const { data: systemData, error: systemError } = await supabase
            .from('system_instructions')
            .select('content')
            .eq('id', 1)
            .single();

        if (systemError) {
            console.error('Supabase error (system):', systemError);
            throw new Error('Failed to fetch system instructions');
        }

        const systemInstruction = systemData?.content || 'You are a helpful assistant.';

        // Step B: Fetch Chat History (Last 10 messages)
        const { data: historyData, error: historyError } = await supabase
            .from('chat_logs')
            .select('role, content')
            .eq('channel_id', outputChannelId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (historyError) {
            console.error('Supabase error (history):', historyError);
            // Proceed without history if fail
        }

        // historyData is newest first, reverse it for the prompt
        const history = (historyData || []).reverse();

        // Step C: Construct Prompt
        let prompt = `System: ${systemInstruction}\n\nChat History:\n`;

        history.forEach(msg => {
            prompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}\n`;
        });

        prompt += `\nUser: ${message.content}`;

        // Step D: Call Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini response received');

        // Step E: Send result back to Discord
        if (text.length > 2000) {
            const chunks = text.match(/[\s\S]{1,2000}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(text);
        }

        // Step F: Save Memory (Async)
        await supabase.from('chat_logs').insert([
            { channel_id: outputChannelId, role: 'user', content: message.content },
            { channel_id: outputChannelId, role: 'model', content: text }
        ]);
        console.log('Memory saved');

    } catch (err) {
        console.error('Error processing message:', err);
        message.reply('⚠️ Brain freeze! I encountered an error.');
    }
});

client.login(process.env.DISCORD_TOKEN);
