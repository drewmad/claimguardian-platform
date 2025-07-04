/**
 * @fileMetadata
 * @purpose Provides a helper function to interact with the Gemini API for AI-powered features.
 * @owner frontend-team
 * @dependencies ["react"] // Assuming fetch is globally available or polyfilled
 * @exports ["callGeminiAPI"]
 * @complexity medium
 * @tags ["api", "ai", "gemini", "utility"]
 * @status active
 */
const callGeminiAPI = async (prompt, chatHistory = [], jsonSchema = null, attachedImage = null) => {
    const apiKey = ""; // Leave empty for demo mode
    
    // If no API key, use mock responses
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        console.log("No API key found, using mock responses for demo");
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Return mock responses based on the prompt
        if (prompt.includes("filing an insurance claim")) {
            return jsonSchema ? {
                scope: "Water damage repair including drywall replacement, carpet removal, and mold remediation",
                cost: 8500,
                time: "5-7 business days"
            } : "Based on the incident details, I recommend documenting all damaged items with photos and keeping receipts for any emergency repairs.";
        }
        
        if (prompt.includes("Analyze the attached image") && prompt.includes("damage")) {
            return `**Observed Damage:** The image shows significant water damage to the ceiling and walls, with visible water stains and potential mold growth.\n\n**Likely Cause:** This appears to be water damage from a burst pipe or roof leak, based on the pattern of staining.\n\n**Policy Coverage Analysis:** This type of damage is typically covered under Section II, Clause 4a: Water Damage in standard homeowners policies. Coverage would include repair costs minus your deductible.`;
        }
        
        if (prompt.includes("Identify ALL personal property items")) {
            return jsonSchema ? {
                items: [
                    { name: "Samsung 55\" TV", category: "Electronics", value: 800, description: "Wall-mounted flat screen TV" },
                    { name: "Leather Recliner", category: "Furniture", value: 1200, description: "Brown leather reclining chair" },
                    { name: "Coffee Table", category: "Furniture", value: 400, description: "Glass-top wooden coffee table" },
                    { name: "Floor Lamp", category: "Lighting", value: 150, description: "Modern standing lamp with shade" }
                ]
            } : "I can see several items in the room including electronics and furniture.";
        }
        
        if (prompt.includes("Identify the main personal property item")) {
            return jsonSchema ? {
                name: "LG Refrigerator",
                category: "Appliance",
                value: 1500,
                description: "Stainless steel French door refrigerator with ice maker",
                serial: "LG123456789"
            } : "The main item appears to be a large kitchen appliance.";
        }
        
        // Default response
        return jsonSchema ? {} : "I'm here to help with your insurance and asset management needs. Could you please be more specific about what you'd like assistance with?";
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const userParts = [{ text: prompt }];
    if (attachedImage) {
        userParts.push({
            inlineData: {
                mimeType: attachedImage.mimeType,
                data: attachedImage.data
            }
        });
    }

    const contents = [...chatHistory, { role: "user", parts: userParts }];
    
    const payload = { contents };

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
            console.error("API Error Response:", errorBody);
            
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
            console.error("Unexpected API response structure:", result);
            if (result.promptFeedback && result.promptFeedback.blockReason) {
              return `My apologies, but I cannot fulfill that request. Reason: ${result.promptFeedback.blockReason}`;
            }
            return "Sorry, I couldn't get a response. Please try again.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return jsonSchema ? {} : "I'm currently in demo mode. AI features are limited but you can still explore the interface!";
    }
};

export default callGeminiAPI;
