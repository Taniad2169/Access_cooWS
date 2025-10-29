// /api/chatgpt.js - CORRECTED VERSION

// Helper function to parse the body correctly across different Vercel runtimes
async function parseBody(req) {
    if (req.body && typeof req.body === 'object') {
        // Handle cases where the body is already parsed
        return req.body;
    }
    
    // Attempt to use req.json() for newer Web Standard Request objects
    if (typeof req.json === 'function') {
        try {
            return await req.json();
        } catch (e) {
            // If req.json fails (e.g., empty body), fall through
        }
    }

    // Standard Node.js way to read the body stream
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
        
        if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured in Vercel Environment Variables');
        
        // Your existing ChatGPT API call logic
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            const result = data.choices[0].message.content;
            res.status(200).json({ response: result, message: 'Success' });
        } else if (data.error) {
            throw new Error(data.error.message);
        } else {
            throw new Error('No valid response or choices from OpenAI API.');
        }
    } catch (error) {
        res.status(500).json({ error: `ChatGPT API Error: ${error.message}` });
    }
}
