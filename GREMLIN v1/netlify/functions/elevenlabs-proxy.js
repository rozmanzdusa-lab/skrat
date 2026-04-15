const Buffer = require('buffer').Buffer;

exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { text } = body;

        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = "cIZcl38x1P5GXwgmin8s";

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" })
            };
        }

        if (!text || !text.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Empty text" })
            };
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
                "accept": "audio/mpeg"
            },
            body: JSON.stringify({
                text: text.trim(),
                model_id: "eleven_v3",
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.75,
                    style: 0.0,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: "ElevenLabs API error",
                    details: errorText
                })
            };
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                audioContent: base64Audio
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal server error",
                details: error.message
            })
        };
    }
};