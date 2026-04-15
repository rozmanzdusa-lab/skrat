const Buffer = require('buffer').Buffer;

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { text } = body;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = "Z7RrOqZFTyLpIlzCgfsp"; // Tvoj ID za škrata

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "Manjka API ključ v .env datoteki!" }) };
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_v3", 
                voice_settings: {
                    stability: 0.75,      // Stabilen, normalen glas
                    similarity_boost: 0.75,
                    style: 0.0,           // Brez pretiravanja
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            return { statusCode: response.status, body: JSON.stringify({ error: error }) };
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioContent: base64Audio })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};