require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ------------------------------------------------------------------
// 1. SETUP
// ------------------------------------------------------------------

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

// ------------------------------------------------------------------
// 2. LOGIC
// ------------------------------------------------------------------

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`🤖 Model: gemini-1.5-flash | 🧠 Embeddings: text-embedding-004`);
});

client.on('messageCreate', async (message) => {
    // Ignore bots
    if (message.author.bot) return;

    try {
        const outputChannelId = message.channel.id;
        console.log(`\n📨 Received message in ${outputChannelId}: "${message.content}"`);

        // --------------------------------------------------------------
        // CHECK ALLOW-LIST
        // --------------------------------------------------------------
        const { data: channelData, error: channelError } = await supabase
            .from('allowed_channels')
            .select('channel_id')
            .eq('channel_id', outputChannelId)
            .single();

        if (channelError && channelError.code !== 'PGRST116') {
            console.error('❌ DB Error checking allow-list:', channelError);
            return;
        }

        if (!channelData) {
            console.log(`🚫 Channel ${outputChannelId} is NOT allowed. Ignoring.`);
            return;
        }
        console.log(`✅ Channel is allowed. Processing...`);


        // --------------------------------------------------------------
        // STEP A: SEARCH (Generate Embedding)
        // --------------------------------------------------------------
        console.log(`🔍 Step A: Generating embedding...`);
        const embeddingResult = await embeddingModel.embedContent(message.content);
        const embedding = embeddingResult.embedding.values;


        // --------------------------------------------------------------
        // STEP B: MATCH (RPC Call)
        // --------------------------------------------------------------
        console.log(`📡 Step B: Matching documents (Threshold: 0.5, Limit: 3)...`);
        const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3
        });

        if (matchError) {
            console.error('❌ Step B Error:', matchError);
            // We continue without context if RAG fails
        }


        // --------------------------------------------------------------
        // STEP C: CONTEXT (Prepare String)
        // --------------------------------------------------------------
        let contextData = '';
        if (documents && documents.length > 0) {
            console.log(`✅ Step C: FOUND ${documents.length} DOCUMENTS!`);
            contextData = documents.map((doc, index) => {
                console.log(`   [${index + 1}] Similarity: ${doc.similarity.toFixed(4)}`);
                return doc.content;
            }).join('\n\n---\n\n');
        } else {
            console.log(`🤷 Step C: No relevant documents found.`);
        }


        // --------------------------------------------------------------
        // SYSTEM INSTRUCTIONS & HISTORY
        // --------------------------------------------------------------
        // Fetch System Instructions
        const { data: systemData } = await supabase
            .from('system_instructions')
            .select('content')
            .eq('id', 1)
            .single();
        const systemInstruction = systemData?.content || 'You are a helpful assistant.';

        // Fetch Chat History
        const { data: historyData } = await supabase
            .from('chat_logs')
            .select('role, content')
            .eq('channel_id', outputChannelId)
            .order('created_at', { ascending: false })
            .limit(10);
        const history = (historyData || []).reverse();


        // --------------------------------------------------------------
        // STEP D: PROMPT (Inject Context)
        // --------------------------------------------------------------
        console.log(`📝 Step D: Constructing Prompt...`);
        let prompt = `System: ${systemInstruction}\n`;

        if (contextData) {
            prompt += `\n[IMPORTANT] Context from Knowledge Base:\n${contextData}\n\nUse the context above to answer the user's question if relevant.\n`;
        }

        prompt += `\nChat History:\n`;
        history.forEach(msg => {
            prompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}\n`;
        });
        prompt += `\nUser: ${message.content}`;


        // --------------------------------------------------------------
        // STEP E: REPLY (Generate & Send)
        // --------------------------------------------------------------
        console.log(`🤖 Step E: Generating response...`);
        const result = await chatModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`📤 sending response (${text.length} chars)...`);

        // Discord message limit handling
        if (text.length > 2000) {
            const chunks = text.match(/[\s\S]{1,2000}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(text);
        }


        // --------------------------------------------------------------
        // STEP F: SAVE (Memory)
        // --------------------------------------------------------------
        console.log(`💾 Step F: Saving conversation...`);
        await supabase.from('chat_logs').insert([
            { channel_id: outputChannelId, role: 'user', content: message.content },
            { channel_id: outputChannelId, role: 'model', content: text }
        ]);
        console.log(`✅ Cycle Complete.`);

    } catch (err) {
        console.error('🔥 CRITICAL ERROR:', err);
        message.reply('⚠️ System malfunction. Check logs.');
    }
});

client.login(process.env.DISCORD_TOKEN);
