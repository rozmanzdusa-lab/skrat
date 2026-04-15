/**
 * SOS Gremlin - Univerzalni Netlify Proxy
 * Podpira: Tekst, Klasifikacijo in TTS (Zvok)
 */

const apiKey = process.env.GEMINI_API_KEY;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

exports.handler = async function (event, context) {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: CORS_HEADERS,
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Method not allowed" })
        };
    }

    try {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY missing v Netlify nastavitvah");
        }

        let body;
        try {
            body = JSON.parse(event.body || "{}");
        } catch (parseError) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: "Invalid JSON body" })
            };
        }

        // Določimo model: Če gre za zvočne modalitete, uporabimo TTS model, sicer navaden Flash
        const isTTS = body.generationConfig?.responseModalities?.includes("AUDIO");
        const model = isTTS ? "gemini-2.5-flash-preview-tts" : "gemini-2.5-flash";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const responseText = await response.text();
        let data;

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            return {
                statusCode: 502,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    error: "Invalid response from Gemini",
                    status: response.status,
                    details: responseText.slice(0, 1000)
                })
            };
        }

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    error: data?.error?.message || "Gemini API error",
                    status: response.status,
                    details: data
                })
            };
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: error.message })
        };
    }
};
