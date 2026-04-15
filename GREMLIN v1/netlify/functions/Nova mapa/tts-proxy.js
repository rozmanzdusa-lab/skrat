/**
 * SOS Gremlin - ElevenLabs Proxy (v3)
 * NASTAVITVE: Normalen, stabilen in naraven glas
 */
const Buffer = require('buffer').Buffer;

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { text } = body;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = "Z7RrOqZFTyLpIlzCgfsp"; 

        if (!apiKey) {
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "Manjka API ključ!" }) 
            };
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
                    stability: 0.75,      // VIŠJE = Bolj konstanten, manj čustven in "normalen" glas
                    similarity_boost: 0.75, // STANDARD = Dobro ohranjanje barve originalnega glasu
                    style: 0.0,           // NIČLA = Odstrani pretiravanje in karakterne poudarke
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { statusCode: response.status, body: JSON.stringify({ error: errorText }) };
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

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
            body: JSON.stringify({ error: "Napaka: " + error.message }) 
        };
    }
};