import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PDFParser from 'pdf2json';

export const dynamic = 'force-dynamic';

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Helper to parse PDF buffer
async function parsePDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true); // true = text content only

        pdfParser.on("pdfParser_dataError", (errData: any) => {
            reject(errData.parserError);
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            // Extract raw text content
            const text = pdfParser.getRawTextContent();
            resolve(text);
        });

        try {
            pdfParser.parseBuffer(buffer);
        } catch (e) {
            reject(e);
        }
    });
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text using pdf2json
        let text = '';
        try {
            text = await parsePDF(buffer);
        } catch (parseError) {
            console.error("PDF Parsing Error:", parseError);
            return NextResponse.json({ error: 'Failed to parse PDF content' }, { status: 400 });
        }

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 });
        }

        // Split into chunks of 500 characters
        const chunkSize = 500;
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }

        console.log(`Processing ${chunks.length} chunks...`);

        // Generate embeddings and insert into Supabase
        let successCount = 0;

        for (const chunk of chunks) {
            // Get embedding
            const result = await model.embedContent(chunk);
            const embedding = result.embedding.values;

            // Insert
            const { error } = await supabase
                .from('documents')
                .insert({
                    content: chunk,
                    embedding: embedding
                });

            if (error) {
                console.error('Supabase insertion error:', error);
            } else {
                successCount++;
            }
        }

        return NextResponse.json({
            message: 'Training completed',
            totalChunks: chunks.length,
            embeddedChunks: successCount
        });

    } catch (error) {
        console.error('Training error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
    }
}
