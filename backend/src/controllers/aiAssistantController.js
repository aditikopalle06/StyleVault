const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Retry temporary Gemini 503 / UNAVAILABLE errors.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(request, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await genAI.models.generateContent(request);
        } catch (error) {
            const message = String(error?.message || error);
            const status = error?.status ?? error?.statusCode ?? error?.code;

            const isUnavailable =
                Number(status) === 503 ||
                /\b503\b|UNAVAILABLE|high demand|overloaded|temporarily unavailable/i.test(message);

            if (!isUnavailable || attempt === maxAttempts) {
                throw error;
            }

            const delayMs = 1000 * (2 ** (attempt - 1));

            console.warn(
                `Gemini unavailable. Retry ${attempt + 1}/${maxAttempts} in ${delayMs}ms.`
            );

            await sleep(delayMs);
        }
    }
}

async function chatWithAssistant(req, res) {
    try {
        const userId = req.user.user_id;
        const { message } = req.body;

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Please enter a message."
            });
        }

        // 1. Fetch only the logged-in user's wardrobe.
        const clothingResult = await pool.query(
            `SELECT item_id, name, category, colour,
                    season, occasion, size, extra_info, image
             FROM clothing
             WHERE user_id = $1
             ORDER BY item_id`,
            [userId]
        );

        const wardrobe = clothingResult.rows;

        // 2. Fetch the user's saved preferences.
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
                outfits: [],
                followUpPrompts: [],
                wardrobeSuggestions: []
            });
        }

        // 3. Create an authoritative lookup of actual wardrobe items.
        const wardrobeById = new Map(
            wardrobe.map((item) => [
                String(item.item_id),
                item
            ])
        );

        // Send only necessary wardrobe metadata to Gemini.
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

        // 4. Prepare the prompt.
        const prompt = `
You are Muse, the personal stylist inside StyleVault.

Your job is to help the user style clothing they actually own,
discover new styling possibilities, and identify useful additions
that could make their wardrobe more versatile.

USER'S REQUEST:
${message.trim()}

THE USER'S COMPLETE WARDROBE:
${JSON.stringify(wardrobeForAI, null, 2)}

SAVED USER PREFERENCES:
${JSON.stringify(preferences, null, 2)}

STRICT WARDROBE RULES:

1. The wardrobe above is the authoritative list of items the
   user owns. Never assume they own anything else.

2. Every clothing item used in an outfit MUST use an item_id
   from the supplied wardrobe.

3. Copy item IDs exactly. Never invent IDs.

4. Do not invent clothing names or replace wardrobe items
   with different items.

5. Do not assume the user owns common items such as sneakers,
   jackets, accessories, jeans, bags, or plain shirts unless
   they appear in the supplied wardrobe.

6. Never include external recommendations as owned outfit items.

7. Use only the supplied metadata when describing existing
   clothing. Do not claim to have visually analysed photographs.

8. Do not recommend combinations that require unavailable
   clothing items.

9. You MAY recommend items that are not in the wardrobe,
   but only as clearly labelled optional additions.

10. Never claim that an externally suggested item is already
    owned by the user.

MULTIPLE OUTFITS:

For ordinary outfit requests, generate 3–5 distinct outfits
when the available wardrobe supports them.

Aim for five useful combinations when possible.

Make outfits meaningfully different through colour coordination,
styling approach, layering, or aesthetic.

Reusing wardrobe items across outfits is allowed.

Do not invent items to reach the target number.

If the user requests one outfit, return one.
If the wardrobe supports fewer good combinations, return fewer.

STYLING:

Consider the user's preferences, requested occasion, known
colours, available clothing attributes, practicality, and
versatility.

Give each outfit a distinct title and useful styling reasoning.

Do not invent unknown fabric, pattern, fit, or visual details.

For general fashion questions, answer directly without forcing
outfit cards.

ACCESSORY BALANCE AND REALISTIC STYLING:

Accessories must be selected intentionally. The goal is to create
a cohesive, wearable outfit, not to include every available
accessory in the wardrobe.

1. Normally, include 1–2 accessories per outfit.
   Use 3 only when the requested aesthetic specifically supports
   a more heavily accessorized look.

2. Avoid wearing multiple accessories that serve the same
   purpose or create unnecessary visual clutter.

3. Do not automatically recommend a watch, bracelet, chain,
   rings, and other accessories together.

4. When a watch is included, consider whether a bracelet is
   actually needed. A watch alone is often sufficient.

5. Do not recommend multiple bracelets together unless the
   requested style specifically calls for bracelet stacking.

6. Choose accessories based on the outfit's aesthetic:
   - Streetwear: cap, chain, rings, or a statement bag.
   - Smart casual: watch, belt, or a subtle bracelet.
   - Minimalist: one understated accessory.
   - Grunge or edgy: selected statement accessories, without
     overcrowding the outfit.
   - Ethnic: accessories appropriate to the ethnic outfit.

7. Accessories should complement the outfit's colours,
   proportions, occasion, and overall styling direction.

8. Different outfits may use different accessories. Do not
   repeatedly include the same accessories in every outfit.

9. Only include accessories that genuinely improve the look.
   An outfit does not need an accessory simply because one
   is available.

10. All accessories must still be actual items from the
    user's wardrobe, with their correct item IDs.

EXTERNAL WARDROBE ADDITION RECOMMENDATIONS:

Do not put external clothing recommendations inside individual
outfit cards. Put useful optional additions in the separate
wardrobeSuggestions array.

ALTERNATIVE STYLING:

For each outfit, provide an alternative way to style the SAME
wardrobe pieces.

Examples:
- A more casual styling approach.
- A more polished or formal styling approach.
- A different way to tuck, layer, or combine existing pieces.
- A different styling direction appropriate to the occasion.

Use only known wardrobe items when describing clothing the
user already owns.

If an alternative requires an unavailable item, identify it
as an optional external addition rather than implying ownership.

Keep the alternative practical, concise, and distinct from
the original styling tip.

ACCESSORY SUGGESTIONS:

Do not create per-outfit accessorySuggestions. Keep external
item recommendations in the separate wardrobeSuggestions array
so they appear in one dedicated section.

WARDROBE EXPANSION SUGGESTIONS:

After generating the requested outfits using only the user's
existing wardrobe, evaluate whether additional items could
meaningfully expand their future outfit options.

These recommendations will appear in a separate section called
"Expand Your Wardrobe".

Do NOT add external items to individual outfit item arrays.
Do NOT present external items as clothing the user already owns.

Your goal is not simply to accessorize the generated outfits.
Identify useful additions that could help the user create MORE
outfit combinations in the future.

For example, a plain white T-shirt could be useful if it combines
with multiple items already in the user's wardrobe.

For every suggested addition:

1. Name the specific clothing item.
2. Explain why it would be useful.
3. Explain how it could combine with multiple existing items,
   using actual wardrobe items where possible.
4. Explain what NEW outfit possibilities it could create.
5. Mention other useful occasions or styling situations.
6. Clearly state that it is optional and is not confirmed to
   be owned by the user.

Prioritize versatile additions that unlock several combinations.

Do not assume there is a wardrobe gap simply because an item
is a common basic.

Avoid unnecessary shopping recommendations. If the existing
wardrobe already supports the requested styles well, return
only genuinely useful additions or an empty array.

Recommend 2–4 additions when meaningful.
Do not invent the user's budget or shopping preferences.

FOLLOW-UP PROMPTS:

When useful, return 3–4 short follow-up prompts that help the
user continue the styling conversation.

Examples:
- "Make this look more casual"
- "Suggest more versatile wardrobe additions"
- "Show me a more polished version"
- "Try a different colour combination"
- "Style this for a specific occasion"

Keep prompts concise and relevant.

These are suggestions for the user to select. Do not answer
them in advance.

For general fashion questions, follow-up prompts should relate
to the question rather than automatically focusing on outfits.

GENERAL QUESTIONS:

If the user asks a general fashion question, answer naturally
in the reply field without forcing outfit cards.

If the user asks for outfits, the reply field should contain
only a concise introduction. Detailed outfit information will
be displayed in cards.

OUTPUT FORMAT:

Return valid JSON with exactly these four top-level fields:

{
  "reply": "A concise introduction or general styling answer",
  "outfits": [
    {
      "title": "Descriptive outfit name",
      "description": "Description of the overall look",
      "whyItWorks": "Styling reasoning",
      "stylingTip": "Practical styling advice",
      "alternativeStyling": "Another way to style the same pieces",
      "items": [
        {
          "item_id": 1,
          "role": "Top"
        }
      ]
    }
  ],
  
  "wardrobeSuggestions": [
    {
      "item": "Plain white T-shirt",
      "whyAddIt": "It is versatile and works with several items.",
      "outfitPossibilities": "Explain how it could combine with actual items in the wardrobe to create more outfits."
    }
  ],
    "followUpPrompts": [
    "Make this look more casual",
    "Suggest more versatile wardrobe additions",
    "Try a different colour combination"
  ]
}

OUTPUT VALIDATION RULES:

1. Every outfit must have title, description, whyItWorks,
   stylingTip, alternativeStyling, and items.
2. Each outfit item must have item_id and role.
3. Every outfit item_id MUST belong to the supplied wardrobe.
4. Each follow-up prompt must be a short string.
5. Return an empty outfits array when outfit cards are not appropriate.
6. Return an empty followUpPrompts array when follow-ups are not useful.
7. wardrobeSuggestions must contain objects with item, whyAddIt,
   and outfitPossibilities, each as a string.
8. Wardrobe suggestions are optional recommendations, not
   confirmed owned items.
9. Keep wardrobeSuggestions separate from outfits and their items.
10. Return an empty wardrobeSuggestions array if no useful
    additions are needed.
11. Return only valid JSON with exactly these four top-level fields:
    reply, outfits, followUpPrompts, wardrobeSuggestions.
12. Do not include Markdown code fences or extra text outside JSON.
`;

        // 5. Call Gemini, retrying temporary 503 errors.
        const result = await generateWithRetry({
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

        // 6. Parse Gemini's JSON response.
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

        // 7. Validate all outfit items against this user's wardrobe.
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

                        // Reject IDs that do not belong to this user.
                        if (!wardrobeById.has(itemId)) {
                            console.warn(
                                "Rejected invalid wardrobe item ID:",
                                recommended.item_id,
                                "User:",
                                userId
                            );
                            continue;
                        }

                        // Avoid duplicate items inside the same outfit.
                        if (seenIds.has(itemId)) {
                            continue;
                        }

                        seenIds.add(itemId);

                        const actualItem = wardrobeById.get(itemId);

                        // Use PostgreSQL values for names and images.
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

                    // Do not show an outfit with no valid wardrobe items.
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

                        alternativeStyling:
                            typeof outfit.alternativeStyling === "string"
                                ? outfit.alternativeStyling
                                : "",

                        items: validatedItems
                    };
                })
                .filter(Boolean)
            : [];

        // 8. Build the reply without duplicating the outfit cards.
        let reply;

        if (validatedOutfits.length > 0) {
            reply =
                "Here are your personalized outfit ideas using " +
                "items from your StyleVault wardrobe!";
        } else {
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

        // 9. Validate follow-up prompts.
        const followUpPrompts = Array.isArray(aiResponse.followUpPrompts)
            ? aiResponse.followUpPrompts
                .filter((item) => typeof item === "string")
                .slice(0, 4)
            : [];

        // 10. Validate wardrobe expansion suggestions.
        const wardrobeSuggestions = Array.isArray(
            aiResponse.wardrobeSuggestions
        )
            ? aiResponse.wardrobeSuggestions
                .filter(
                    (item) =>
                        item &&
                        typeof item === "object" &&
                        !Array.isArray(item)
                )
                .map((item) => ({
                    item:
                        typeof item.item === "string"
                            ? item.item.trim()
                            : "",

                    whyAddIt:
                        typeof item.whyAddIt === "string"
                            ? item.whyAddIt.trim()
                            : "",

                    outfitPossibilities:
                        typeof item.outfitPossibilities === "string"
                            ? item.outfitPossibilities.trim()
                            : ""
                }))
                .filter(
                    (item) =>
                        item.item &&
                        item.whyAddIt &&
                        item.outfitPossibilities
                )
                .slice(0, 4)
            : [];

        // 11. Return the complete response to the frontend.
        return res.status(200).json({
            reply,
            outfits: validatedOutfits,
            followUpPrompts,
            wardrobeSuggestions
        });

    } catch (error) {
        console.error("AI Assistant error:", error);

        const errorMessage = String(error?.message || error);
        const status = error?.status ?? error?.statusCode ?? error?.code;

        const isUnavailable =
            Number(status) === 503 ||
            /\b503\b|UNAVAILABLE|high demand|overloaded/i.test(errorMessage);

        if (isUnavailable) {
            return res.status(503).json({
                error: "Muse is temporarily busy. Please try again in a moment."
            });
        }

        return res.status(500).json({
            error:
                "Something went wrong while generating your outfit recommendation. Please try again."
        });
    }
}

module.exports = { chatWithAssistant };