
const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function chatWithAssistant(req, res) {
    try {
        const userId = req.user.user_id;
        const { message } = req.body;

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Please enter a message."
            });
        }

        // 1. Fetch ONLY the logged-in user's wardrobe.
        const clothingResult = await pool.query(
            `SELECT item_id, name, category, colour,
                    season, occasion, size, extra_info, image
             FROM clothing
             WHERE user_id = $1
             ORDER BY item_id`,
            [userId]
        );

        const wardrobe = clothingResult.rows;

        // 2. Fetch this user's saved preferences.
        const preferencesResult = await pool.query(
            `SELECT preferred_styles, preferred_colours,
                    preferred_occasions, preferred_seasons,
                    preferred_fit, additional_preferences
             FROM user_preferences
             WHERE user_id = $1`,
            [userId]
        );

        const preferences = preferencesResult.rows[0] || null;

        if (wardrobe.length === 0) {
            return res.status(200).json({
                reply:
                    "Your wardrobe is currently empty. Add some clothing " +
                    "items to StyleVault so I can recommend outfits using " +
                    "clothes you actually own.",
                outfits: []
            });
        }

        // 3. Create an authoritative lookup of actual wardrobe items.
        // Gemini cannot add items to this map.
        const wardrobeById = new Map(
            wardrobe.map((item) => [
                String(item.item_id),
                item
            ])
        );

        // Give Gemini only the wardrobe metadata it needs.
        const wardrobeForAI = wardrobe.map((item) => ({
            item_id: item.item_id,
            name: item.name,
            category: item.category,
            colour: item.colour,
            season: item.season,
            occasion: item.occasion,
            size: item.size,
            extra_info: item.extra_info
        }));

        // 4. Generate recommendations with strict wardrobe restrictions.
        const prompt = `
You are Muse, the personal stylist inside StyleVault.

Your job is to help the user style clothing they actually own.

USER'S REQUEST:
${message.trim()}

THE USER'S COMPLETE WARDROBE:
${JSON.stringify(wardrobeForAI, null, 2)}

SAVED USER PREFERENCES:
${JSON.stringify(preferences, null, 2)}

STRICT WARDROBE RULES:

1. The wardrobe above is the authoritative list of items the
   user owns. Never assume they own anything else.

2. Every recommended clothing item MUST use an item_id from
   the supplied wardrobe.

3. Copy item IDs exactly. Never invent IDs.

4. Do not invent clothing names or replace wardrobe items
   with different items.

5. Do not assume the user owns common items such as sneakers,
   jackets, accessories, jeans, or plain shirts unless they
   actually appear in the supplied wardrobe.

6. Do not include suggested purchases as owned outfit items.

7. Use only the supplied metadata. Do not claim to have
   visually analysed clothing photographs.

8. Do not recommend combinations that require unavailable
   clothing items.

MULTIPLE OUTFITS:

For ordinary outfit requests, generate 3–5 distinct outfits
when the available wardrobe supports them.

Aim for five genuinely useful combinations when possible.

Make outfits meaningfully different through colour coordination,
styling approach, layering, or aesthetic.

Reusing wardrobe items across outfits is allowed.

Do not invent items to reach the target number.

If the user requests one outfit, return one.
If the wardrobe supports fewer good combinations, return fewer.

STYLING:

Consider the user's preferences, occasion, known colours,
available clothing attributes, practicality, and versatility.

Give each outfit a distinct title and useful styling reasoning.

Do not invent unknown fabric, pattern, fit, or visual details.

For a general fashion question, answer directly without
forcing outfit cards.

WARDROBE UPGRADES:

Suggest future purchases only when useful.

Clearly distinguish proposed purchases from existing items.
Never include proposed purchases in outfit item arrays.

OUTPUT FORMAT:

Return valid JSON with exactly these two top-level fields:

{
  "reply": "A concise introduction or general styling answer",
  "outfits": [
    {
      "title": "Descriptive outfit name",
      "description": "Description of the overall look",
      "whyItWorks": "Styling reasoning",
      "stylingTip": "Practical styling advice",
      "items": [
        {
          "item_id": 1,
          "role": "Top"
        }
      ]
    }
  ]
}

Each outfit must have title, description, whyItWorks,
stylingTip, and items.

Each item must have item_id and role.

Use actual item IDs from the supplied wardrobe.

Return an empty outfits array when outfit cards are not appropriate.

Return only valid JSON without Markdown code fences.
`;

        const result = await genAI.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const rawText = result.text;

        if (!rawText) {
            return res.status(502).json({
                error: "Muse could not generate a response. Please try again."
            });
        }

        // 5. Parse Gemini's JSON response.
        let aiResponse;

        try {
            aiResponse = JSON.parse(rawText.trim());
        } catch (error) {
            console.error("Gemini JSON parsing error:", error.message);

            return res.status(502).json({
                error: "Muse returned an invalid response. Please try again."
            });
        }

        if (
            !aiResponse ||
            typeof aiResponse !== "object" ||
            Array.isArray(aiResponse)
        ) {
            return res.status(502).json({
                error: "Muse returned an invalid response."
            });
        }

        // 6. Validate every recommended item against the actual
        // wardrobe belonging to the logged-in user.
        const validatedOutfits = Array.isArray(aiResponse.outfits)
            ? aiResponse.outfits
                .filter(
                    (outfit) =>
                        outfit &&
                        typeof outfit === "object" &&
                        Array.isArray(outfit.items)
                )
                .map((outfit) => {
                    const validatedItems = [];
                    const seenIds = new Set();

                    for (const recommended of outfit.items) {
                        if (
                            !recommended ||
                            recommended.item_id == null
                        ) {
                            continue;
                        }

                        const itemId = String(recommended.item_id);

                        // Reject IDs that do not belong to this user's
                        // actual wardrobe.
                        if (!wardrobeById.has(itemId)) {
                            console.warn(
                                "Rejected invalid wardrobe item ID:",
                                recommended.item_id,
                                "User:",
                                userId
                            );
                            continue;
                        }

                        // Avoid duplicates inside the same outfit.
                        if (seenIds.has(itemId)) {
                            continue;
                        }

                        seenIds.add(itemId);

                        const actualItem = wardrobeById.get(itemId);

                        // Names and attributes always come from PostgreSQL,
                        // never from Gemini's invented item descriptions.
                        validatedItems.push({
                            item_id: actualItem.item_id,
                            name: actualItem.name,
                            category: actualItem.category,
                            colour: actualItem.colour,
                            role:
                                typeof recommended.role === "string"
                                    ? recommended.role
                                    : actualItem.category,
                            image: actualItem.image
                        });
                    }

                    // Do not show an outfit if all its items were invalid.
                    if (validatedItems.length === 0) {
                        return null;
                    }

                    return {
                        title:
                            typeof outfit.title === "string" &&
                            outfit.title.trim()
                                ? outfit.title
                                : "Outfit idea",

                        description:
                            typeof outfit.description === "string"
                                ? outfit.description
                                : "",

                        whyItWorks:
                            typeof outfit.whyItWorks === "string"
                                ? outfit.whyItWorks
                                : "",

                        stylingTip:
                            typeof outfit.stylingTip === "string"
                                ? outfit.stylingTip
                                : "",

                        items: validatedItems
                    };
                })
                .filter(Boolean)
            : [];

        // 7. Build the text reply.
        // Outfit details are displayed in the image cards below.
        // Do not repeat the same outfits in the text response.
        let reply;

        if (validatedOutfits.length > 0) {
            reply =
                "Here are your personalized outfit ideas using " +
                "items from your StyleVault wardrobe!";
        } else {
            // For general questions, use Gemini's text response.
            // For outfit requests without valid items, explain the issue.
            const outfitRequest =
                /\b(outfit|outfits|wear|style|styling|pair|combination|look)\b/i
                    .test(message);

            if (outfitRequest) {
                reply =
                    "I couldn't create a suitable outfit using the " +
                    "wardrobe items returned for this request. Try " +
                    "asking for a different occasion or styling direction.";
            } else {
                reply =
                    typeof aiResponse.reply === "string" &&
                    aiResponse.reply.trim()
                        ? aiResponse.reply
                        : "How would you like help styling your wardrobe?";
            }
        }

        // 8. Return the reply and validated outfit cards.
        // The frontend uses outfits to display the clothing images.
        return res.status(200).json({
            reply,
            outfits: validatedOutfits
        });

    } catch (error) {
        console.error("AI Assistant error:", error);

        return res.status(500).json({
            error:
                "Something went wrong while generating your outfit recommendation."
        });
    }
}

module.exports = { chatWithAssistant };
