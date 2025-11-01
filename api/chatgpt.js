// /api/chatgpt.js - OPTIMIZED & FIXED VERSION

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Parse body - Vercel automatically parses JSON for us
        const { prompt, test, type, url, state } = req.body || {};
        
        // Handle test request
        if (test) {
            return res.status(200).json({ 
                status: 'ok', 
                message: 'API is working correctly',
                timestamp: new Date().toISOString()
            });
        }
        
        // Validate prompt
        if (!prompt) {
            return res.status(400).json({ 
                error: 'Missing prompt in request body' 
            });
        }
        
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY not found in environment variables');
            return res.status(500).json({ 
                error: 'OPENAI_API_KEY not configured. Please add it to Vercel Environment Variables.' 
            });
        }
        
        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant specializing in web accessibility and compliance analysis.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });
        
        // Check if OpenAI request was successful
        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('OpenAI API Error:', errorData);
            throw new Error(errorData.error?.message || 'OpenAI API request failed');
        }
        
        const data = await openaiResponse.json();
        
        // Validate response
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response choices returned from OpenAI');
        }
        
        const result = data.choices[0].message.content;
        
        // Return success response
        return res.status(200).json({ 
            response: result,
            message: 'Success',
            type: type || 'general',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Return detailed error
        return res.status(500).json({ 
            error: error.message || 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
