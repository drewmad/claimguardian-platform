/**
 * @fileMetadata
 * @purpose "Provides a helper function to interact with the Gemini API for AI-powered features."
 * @owner frontend-team
 * @dependencies ["react"] // Assuming fetch is globally available or polyfilled
 * @exports ["callGeminiAPI"]
 * @complexity medium
 * @tags ["api", "ai", "gemini", "utility"]
 * @status stable
 */
import * as Sentry from '@sentry/nextjs';
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
const callGeminiAPI = async (
  prompt: string,
  chatHistory: { role: string; parts: Part[] }[] = [],
  jsonSchema: object | null = null,
  attachedImage: { mimeType: string; data: string } | null = null
) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

    const userParts: Part[] = [{ text: prompt }];
    if (attachedImage) {
        userParts.push({
            inlineData: {
                mimeType: attachedImage.mimeType,
                data: attachedImage.data
            }
        });
    }

    const contents = [...chatHistory, { role: "user", parts: userParts }];

    const payload: {
        contents: unknown[];
        generationConfig?: {
            responseMimeType: string;
            responseSchema: unknown;
        };
    } = { contents };

    if (jsonSchema) {
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error("API Error Response:", new Error(errorBody));

            // If API key error, show helpful message
            if (response.status === 400 && errorBody.includes("API_KEY_INVALID")) {
                return jsonSchema ? {} : " API Key Required: To use AI features with real analysis, please add your Gemini API key. For now, I'm providing demo responses.";
            }

            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const responseText = result.candidates[0].content.parts[0].text;
            return jsonSchema ? JSON.parse(responseText) : responseText;
        } else {
            logger.error("Unexpected API response structure:", result);
            if (result.promptFeedback && result.promptFeedback.blockReason) {
              return `My apologies, but I cannot fulfill that request. Reason: ${result.promptFeedback.blockReason}`;
            }
            return "Sorry, I couldn't get a response. Please try again.";
        }
    } catch (error) {
        logger.error("Error calling Gemini API:", toError(error));
        Sentry.captureException(error); // Capture exception with Sentry
        return jsonSchema ? {} : "I'm currently in demo mode. AI features are limited but you can still explore the interface!";
    }
};

export default callGeminiAPI;
