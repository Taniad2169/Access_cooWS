// /api/gemini.js - CORRECTED VERSION

// Helper function to parse the body correctly across different Vercel runtimes
async function parseBody(req) {
    if (req.body && typeof req.body === 'object') {
        // Handle cases where the body is already parsed (e.g., in some Vercel environments)
        return req.body;
    }
    
    // Attempt to use req.json() for newer Web Standard Request objects (Vercel Edge/Next.js App Router)
    if (typeof req.json === 'function') {
        try {
            return await req.json();
        } catch (e) {
            // If req.json fails (e.g., empty body), fall through
        }
    }

    // Standard Node.js way to read the body stream (common in Vercel Serverless Functions)
    try {
        let body = '';
        for await (const chunk of req) {
            body += chunk.toString();
        }
        return body ? JSON.parse(body) : {};
    } catch (e) {
        // If parsing the raw body stream fails
        return {};
    }
}

export default async function handler(req, res) {
    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        // *** FIX APPLIED HERE: Use the robust body parser ***
        const body = await parseBody(req);
        const { prompt } = body; 
        
        if (!prompt) {
             return res.status(400).json({ error: 'Missing prompt in request body' });
        }
        
        // Ensure API Key is set
        if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured in Vercel Environment Variables');
        
        // Your existing Gemini API call logic
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const result = data.candidates[0].content.parts[0].text;
            res.status(200).json({ response: result, message: 'Success' });
        } else if (data.error) {
            throw new Error(data.error.message);
        } else {
            const blockReason = data.candidates ? data.candidates[0].finishReason : 'Unknown';
            throw new Error(`AI response was blocked. Reason: ${blockReason}.`);
        }
    } catch (error) {
        res.status(500).json({ error: `Gemini API Error: ${error.message}` });
    }
}
