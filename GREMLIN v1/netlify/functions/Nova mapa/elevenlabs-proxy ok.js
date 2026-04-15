/**
 * SOS Gremlin - ElevenLabs Proxy
 * Skrbi za varno generiranje škratovskega glasu
 * POSODOBLJENO: Prehod na model v3 in optimizacija za karakterne nastope
 */

exports.handler = async function (event, context) {
    // Dovoli samo POST zahteve
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { text, voice_id, voice_settings } = body;
        const apiKey = process.env.ELEVENLABS_API_KEY;

        console.log("TTS Zahteva prejeta za besedilo:", text?.substring(0, 30) + "...");

        if (!apiKey) {
            console.error("NAPAKA: ELEVENLABS_API_KEY ni nastavljen v okolju Netlify.");
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "Manjka API ključ v nastavitvah strežnika." }) 
            };
        }

        // Tvoj specifičen ID za škratovski glas
        const targetVoiceId = voice_id || "Z7RrOqZFTyLpIlzCgfsp";

        console.log("Kličem ElevenLabs (v3) z glasom:", targetVoiceId);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
            method: 'POST',
            headers: {
                'accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_v3", // POSODOBLJENO NA v3
                voice_settings: voice_settings || {
                    stability: 0.4,       // Spuščeno na 0.4 za večjo variacijo in karakter
                    similarity_boost: 0.8,
                    style: 0.65,          // Zvišano na 0.65 za bolj izrazit nastop škrata
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API Napaka:", response.status, errorText);
            return { 
                statusCode: response.status, 
                body: JSON.stringify({ error: "ElevenLabs zavrnil zahtevo", details: errorText }) 
            };
        }

        console.log("ElevenLabs v3 uspešno generiral zvok. Pretvornba v Base64...");

        const audioBuffer = await response.arrayBuffer();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache"
            },
            body: Buffer.from(audioBuffer).toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        console.error("Sistemska napaka v Proxy funkciji:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Interna napaka strežnika", details: error.message }) 
        };
    }
};