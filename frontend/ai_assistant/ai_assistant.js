
const API_URL = "http://localhost:5000/api/ai-assistant/chat";

const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const clearChatButton = document.getElementById("clear-chat");

const API_ORIGIN = new URL(API_URL).origin;

// ============================================
// LOAD LOGGED-IN USER
// ============================================

function loadUser() {
    try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const user = JSON.parse(storedUser);
        const profileName = document.getElementById("profileName");

        if (profileName) {
            profileName.textContent =
                user.name || user.username || "Fashion Muse";
        }
    } catch (error) {
        console.error("Could not load user details:", error);
    }
}

loadUser();

// ============================================
// CREATE ELEMENTS SAFELY
// ============================================

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

// ============================================
// SAFE MARKDOWN RENDERER FOR MUSE
// ============================================

function renderMarkdown(container, markdown) {
    container.replaceChildren();

    const lines = String(markdown || "").split(/\r?\n/);
    let paragraphLines = [];
    let listElement = null;
    let listType = null;

    function formatInline(text) {
        const fragment = document.createDocumentFragment();
        const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(
                    document.createTextNode(
                        text.slice(lastIndex, match.index)
                    )
                );
            }

            const token = match[0];
            let element;

            if (token.startsWith("**")) {
                element = document.createElement("strong");
                element.textContent = token.slice(2, -2);
            } else if (token.startsWith("*")) {
                element = document.createElement("em");
                element.textContent = token.slice(1, -1);
            } else {
                element = document.createElement("code");
                element.textContent = token.slice(1, -1);
            }

            fragment.appendChild(element);
            lastIndex = pattern.lastIndex;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(
                document.createTextNode(text.slice(lastIndex))
            );
        }

        return fragment;
    }

    function flushParagraph() {
        if (!paragraphLines.length) return;

        const paragraph = document.createElement("p");
        paragraph.appendChild(
            formatInline(paragraphLines.join(" "))
        );

        container.appendChild(paragraph);
        paragraphLines = [];
    }

    function closeList() {
        listElement = null;
        listType = null;
    }

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            closeList();
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);

        if (headingMatch) {
            flushParagraph();
            closeList();

            const level = headingMatch[1].length;
            const heading = document.createElement(`h${level}`);
            heading.appendChild(formatInline(headingMatch[2]));

            container.appendChild(heading);
            continue;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
        const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);

        if (bulletMatch || numberedMatch) {
            flushParagraph();

            const nextType = bulletMatch ? "ul" : "ol";

            if (listType !== nextType) {
                closeList();
                listElement = document.createElement(nextType);
                listType = nextType;
                container.appendChild(listElement);
            }

            const item = document.createElement("li");
            item.appendChild(
                formatInline((bulletMatch || numberedMatch)[1])
            );

            listElement.appendChild(item);
            continue;
        }

        closeList();
        paragraphLines.push(trimmed);
    }

    flushParagraph();
}
// Supports absolute URLs, root-relative paths, and backend-relative paths.
function resolveImageUrl(imagePath) {
    if (!imagePath || typeof imagePath !== "string") {
        return "";
    }

    const path = imagePath.trim();
    if (!path) return "";

    try {
        if (/^(https?:|data:|blob:)/i.test(path)) {
            const url = new URL(path);

            if (!["http:", "https:", "data:", "blob:"].includes(url.protocol)) {
                return "";
            }

            return url.href;
        }

        // Root-relative paths belong to the backend server.
        if (path.startsWith("/")) {
            return new URL(path, API_ORIGIN).href;
        }

        // Do not allow script URLs.
        if (/^(javascript:|vbscript:)/i.test(path)) {
            return "";
        }

        return new URL(path, API_ORIGIN + "/").href;
    } catch {
        return "";
    }
}

// ============================================
// RENDER OUTFIT CARDS
// ============================================

function renderOutfitCard(outfit) {
    const card = createElement("section", "sv-outfit-card");

    // Inline styles keep this feature self-contained:
    // ai_assistant.css does not need to be edited.
    Object.assign(card.style, {
        marginTop: "16px",
        padding: "16px",
        border: "1px solid #e8e1dd",
        borderRadius: "14px",
        background: "#ffffff",
        color: "#1d1b19",
        width: "100%",
        boxSizing: "border-box"
    });

    const title = createElement(
        "h3",
        "sv-outfit-title",
        outfit.title || "Outfit idea"
    );

    Object.assign(title.style, {
        fontFamily: "'Playfair Display', serif",
        fontSize: "20px",
        fontWeight: "600",
        margin: "0 0 6px"
    });

    card.appendChild(title);

    if (outfit.description) {
        const description = createElement(
            "p",
            "sv-outfit-description",
            outfit.description
        );

        Object.assign(description.style, {
            margin: "0 0 14px",
            color: "#62645c",
            fontSize: "13px",
            lineHeight: "1.6"
        });

        card.appendChild(description);
    }

    const items = Array.isArray(outfit.items) ? outfit.items : [];

    const itemGrid = createElement("div", "sv-outfit-items");

    Object.assign(itemGrid.style, {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "12px",
        alignItems: "start"
    });

    items.forEach((item) => {
        const itemCard = createElement("div", "sv-outfit-item");

        Object.assign(itemCard.style, {
            minWidth: "0",
            overflow: "hidden",
            border: "1px solid #ede7e2",
            borderRadius: "10px",
            background: "#fffaf7"
        });

        const imageUrl = resolveImageUrl(item.image);

        if (imageUrl) {
            const image = document.createElement("img");

            image.src = imageUrl;
            image.alt = item.name || "Wardrobe clothing item";
            image.loading = "lazy";

            Object.assign(image.style, {
                display: "block",
                width: "100%",
                height: "190px",
                objectFit: "contain",
                background: "#f9f2ee",
                padding: "6px",
                boxSizing: "border-box"
            });

            image.addEventListener("error", () => {
                image.replaceWith(
                    createElement(
                        "div",
                        "sv-image-unavailable",
                        "Image unavailable"
                    )
                );

                Object.assign(
                    itemCard.querySelector(".sv-image-unavailable").style,
                    {
                        height: "190px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#757871",
                        background: "#f3ede8",
                        padding: "8px",
                        boxSizing: "border-box"
                    }
                );
            });

            itemCard.appendChild(image);
        } else {
            const placeholder = createElement(
                "div",
                "sv-image-unavailable",
                "No photo available"
            );

            Object.assign(placeholder.style, {
                height: "190px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontSize: "12px",
                color: "#757871",
                background: "#f3ede8",
                padding: "8px",
                boxSizing: "border-box"
            });

            itemCard.appendChild(placeholder);
        }

        const details = createElement("div", "sv-item-details");

        Object.assign(details.style, {
            padding: "10px"
        });

        const role = createElement(
            "div",
            "sv-item-role",
            item.role || item.category || "Clothing"
        );

        Object.assign(role.style, {
            color: "#586152",
            fontSize: "11px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "4px"
        });

        const name = createElement(
            "div",
            "sv-item-name",
            item.name || "Wardrobe item"
        );

        Object.assign(name.style, {
            fontSize: "13px",
            fontWeight: "600",
            lineHeight: "1.4",
            overflowWrap: "anywhere"
        });

        details.append(role, name);
        itemCard.appendChild(details);
        itemGrid.appendChild(itemCard);
    });

    card.appendChild(itemGrid);

    function addDescriptionBlock(heading, text) {
        if (!text) return;

        const block = createElement("div", "sv-outfit-explanation");

        Object.assign(block.style, {
            marginTop: "14px",
            fontSize: "13px",
            lineHeight: "1.65"
        });

        const blockHeading = createElement("h4", "", heading);

        Object.assign(blockHeading.style, {
            fontSize: "13px",
            fontWeight: "700",
            margin: "0 0 4px",
            color: "#586152"
        });

        const paragraph = createElement("p", "", text);

        Object.assign(paragraph.style, {
            margin: "0",
            color: "#454841",
            overflowWrap: "anywhere"
        });

        block.append(blockHeading, paragraph);
        card.appendChild(block);
    }

    addDescriptionBlock("Why it works", outfit.whyItWorks);
    addDescriptionBlock("Styling tip", outfit.stylingTip);


    
    // Accessory suggestions
    if (
        Array.isArray(outfit.accessorySuggestions) &&
        outfit.accessorySuggestions.length
    ) {
        const accessoryBlock = createElement(
            "div",
            "sv-outfit-explanation"
        );

        Object.assign(accessoryBlock.style, {
            marginTop: "14px",
            fontSize: "13px",
            lineHeight: "1.65"
        });

        const heading = createElement(
            "h4",
            "",
            "Accessory suggestions"
        );

        Object.assign(heading.style, {
            fontSize: "13px",
            fontWeight: "700",
            margin: "0 0 4px",
            color: "#586152"
        });

        const list = document.createElement("ul");

        Object.assign(list.style, {
            margin: "0",
            paddingLeft: "20px",
            color: "#454841"
        });

        outfit.accessorySuggestions.forEach((suggestion) => {
            const item = document.createElement("li");
            item.textContent = suggestion;
            list.appendChild(item);
        });

        accessoryBlock.append(heading, list);
        card.appendChild(accessoryBlock);
    }

    // Alternative styling
    addDescriptionBlock(
        "Try another version",
        outfit.alternativeStyling
    );


    return card;
}


function renderWardrobeSuggestions(suggestions) {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return null;
    }

    const section = createElement("section", "sv-suggestions-section");

    Object.assign(section.style, {
        marginTop: "20px",
        padding: "18px",
        border: "1px solid #e8e1dd",
        borderRadius: "14px",
        background: "#fffaf7",
        color: "#1d1b19",
        width: "100%",
        boxSizing: "border-box"
    });

    const heading = createElement(
        "h3",
        "sv-suggestions-title",
        "Expand Your Wardrobe"
    );

    Object.assign(heading.style, {
        fontFamily: "'Playfair Display', serif",
        fontSize: "19px",
        fontWeight: "600",
        margin: "0 0 8px"
    });

    section.appendChild(heading);

    const intro = createElement(
        "p",
        "",
        "Optional additions that could help you create more outfits with clothes you already own."
    );

    Object.assign(intro.style, {
        margin: "0 0 12px",
        color: "#62645c",
        fontSize: "12px",
        lineHeight: "1.6"
    });

    section.appendChild(intro);

    suggestions.forEach((suggestion) => {
        if (!suggestion || typeof suggestion !== "object") return;

        const item = createElement("article", "sv-suggestion-item");

        Object.assign(item.style, {
            padding: "14px 0",
            borderTop: "1px solid #e8e1dd"
        });

        const name = createElement(
            "h4",
            "sv-suggestion-name",
            suggestion.item || "Suggested addition"
        );

        Object.assign(name.style, {
            margin: "0 0 8px",
            fontSize: "15px",
            fontWeight: "700"
        });

        item.appendChild(name);

        if (suggestion.whyAddIt) {
            const reasonHeading = createElement("h5", "", "Why add it?");

            Object.assign(reasonHeading.style, {
                margin: "0 0 4px",
                fontSize: "12px",
                color: "#586152"
            });

            const reason = createElement(
                "p",
                "",
                suggestion.whyAddIt
            );

            Object.assign(reason.style, {
                margin: "0 0 10px",
                fontSize: "13px",
                lineHeight: "1.6",
                overflowWrap: "anywhere"
            });

            item.append(reasonHeading, reason);
        }

        if (suggestion.outfitPossibilities) {
            const possibilitiesHeading = createElement(
                "h5",
                "",
                "New outfit possibilities"
            );

            Object.assign(possibilitiesHeading.style, {
                margin: "0 0 4px",
                fontSize: "12px",
                color: "#586152"
            });

            const possibilities = createElement(
                "p",
                "",
                suggestion.outfitPossibilities
            );

            Object.assign(possibilities.style, {
                margin: "0",
                fontSize: "13px",
                lineHeight: "1.6",
                overflowWrap: "anywhere"
            });

            item.append(possibilitiesHeading, possibilities);
        }

        const note = createElement(
            "p",
            "",
            "Optional recommendation — not confirmed to be in your wardrobe."
        );

        Object.assign(note.style, {
            margin: "10px 0 0",
            fontSize: "11px",
            color: "#757871",
            fontStyle: "italic"
        });

        item.appendChild(note);
        section.appendChild(item);
    });

    return section;
}


function renderFollowUpPrompts(prompts) {
    if (!Array.isArray(prompts) || !prompts.length) {
        return null;
    }

    const container = createElement(
        "div",
        "sv-follow-up-prompts"
    );

    Object.assign(container.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "16px"
    });

    prompts.forEach((prompt) => {
        if (typeof prompt !== "string" || !prompt.trim()) {
            return;
        }

        const button = createElement("button", "", prompt);

        button.type = "button";

        Object.assign(button.style, {
            padding: "9px 12px",
            border: "1px solid #dcd6d0",
            borderRadius: "18px",
            background: "#fffaf7",
            color: "#454841",
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left"
        });

        button.addEventListener("click", () => {
            if (!sendButton.disabled) {
                sendMessage(prompt);
            }
        });

        container.appendChild(button);
    });

    return container;
}

// ============================================
// ADD A MESSAGE
// ============================================

function addMessage(
  message,
  sender,
  outfits = [],
  followUpPrompts = [],
  wardrobeSuggestions = []
) {
    const messageElement = createElement(
        "div",
        sender === "user"
            ? "message user-message"
            : "message assistant-message"
    );

    const avatar = createElement("div", "message-avatar");
    const avatarIcon = createElement(
        "span",
        "material-symbols-outlined",
        sender === "user" ? "person" : "auto_awesome"
    );

    avatar.appendChild(avatarIcon);

    const messageBody = createElement("div", "message-body");

    const messageLabel = createElement(
        "div",
        "message-label",
        sender === "user" ? "YOU" : "MUSE"
    );

    const messageBubble = createElement("div", "message-bubble");

    // Keep ordinary replies as plain text.
    // Render Muse's reply with headings, lists, and emphasis.
    if (message) {
        const replyText = createElement("div", "sv-assistant-reply");

        if (sender === "assistant") {
            renderMarkdown(replyText, message);
        } else {
            replyText.textContent = message;
        }

        messageBubble.appendChild(replyText);
    }

    // Outfit cards are created with DOM methods, not HTML strings.
    if (sender === "assistant" && Array.isArray(outfits)) {
        outfits.forEach((outfit) => {
            if (outfit && Array.isArray(outfit.items) && outfit.items.length) {
                messageBubble.appendChild(renderOutfitCard(outfit));
            }
        });
    }
    
    // Render clickable styling follow-ups after the outfit cards.
    
    // Render wardrobe expansion suggestions after outfit cards.
    if (sender === "assistant") {
        const suggestionsElement =
            renderWardrobeSuggestions(wardrobeSuggestions);

        if (suggestionsElement) {
            messageBubble.appendChild(suggestionsElement);
        }

        // Render clickable follow-up prompts.
        const followUpElement =
            renderFollowUpPrompts(followUpPrompts);

        if (followUpElement) {
            messageBubble.appendChild(followUpElement);
        }
    }



    messageBody.append(messageLabel, messageBubble);

    if (sender === "user") {
        messageElement.append(messageBody, avatar);
    } else {
        messageElement.append(avatar, messageBody);
    }

    chatContainer.appendChild(messageElement);
    return messageElement;
}

// ============================================
// SCROLL TO LATEST MESSAGE
// ============================================

function scrollToLatestMessage() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Scroll to the beginning of a specific message inside the chat.
function scrollToMessageTop(messageElement) {
    if (!messageElement) return;

    const containerRect = chatContainer.getBoundingClientRect();
    const messageRect = messageElement.getBoundingClientRect();

    chatContainer.scrollTop += messageRect.top - containerRect.top;
}

// ============================================
// LOADING STATE
// ============================================

function setLoading(isLoading) {
    typingIndicator.hidden = !isLoading;
    sendButton.disabled = isLoading;
    messageInput.disabled = isLoading;

    sendButton.setAttribute(
        "aria-label",
        isLoading ? "Waiting for response" : "Send message"
    );

    
}

// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage(message) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || sendButton.disabled) return;

    const token = localStorage.getItem("token");

    if (!token) {
        addMessage(
            "Your login session could not be found. Please sign in to StyleVault and try again.",
            "assistant"
        );
        return;
    }

    const userMessageElement = addMessage(trimmedMessage, "user");

scrollToMessageTop(userMessageElement);

    messageInput.value = "";
    messageInput.style.height = "auto";

    setLoading(true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: trimmedMessage
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Your session may have expired. Please sign in again."
                );
            }

            throw new Error(
                data.error ||
                `The assistant request failed (${response.status}).`
            );
        }

        if (typeof data.reply !== "string" || !data.reply.trim()) {
            throw new Error(
                "Muse returned an empty response. Please try again."
            );
        }

        const assistantMessageElement = addMessage(
    data.reply,
    "assistant",
    data.outfits || [],
    data.followUpPrompts || [],
    data.wardrobeSuggestions || []
);

// Show the beginning of Muse's completed response.
requestAnimationFrame(() => {
    scrollToMessageTop(assistantMessageElement);
});

    } catch (error) {
        console.error("StyleVault AI Assistant:", error);

        const errorMessageElement = addMessage(
    error.message ||
    "I couldn't reach the assistant. Please check your connection and try again.",
    "assistant"
);

requestAnimationFrame(() => {
    scrollToMessageTop(errorMessageElement);
});
    } finally {
        setLoading(false);
        messageInput.focus();
    }
}

// ============================================
// CHAT FORM
// ============================================

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(messageInput.value);
});

// ============================================
// TEXTAREA AUTO-RESIZE
// ============================================

messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

// ============================================
// ENTER TO SEND; SHIFT+ENTER FOR NEW LINE
// ============================================

messageInput.addEventListener("keydown", (event) => {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

// ============================================
// QUICK PROMPTS
// ============================================

document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
        if (!sendButton.disabled && button.dataset.prompt) {
            sendMessage(button.dataset.prompt);
        }
    });
});

// ============================================
// CLEAR CONVERSATION
// ============================================

clearChatButton.addEventListener("click", () => {
    if (sendButton.disabled) return;

    chatContainer.replaceChildren();

    addMessage(
        "Hi there! ✨ Let's make the most of what you already own. Tell me about your plans, the kind of look you're going for, or a piece of clothing you'd like to style. I'll help you put together an outfit from your StyleVault wardrobe.",
        "assistant"
    );

    messageInput.value = "";
    messageInput.style.height = "auto";
    messageInput.focus();
});

// ============================================
// INITIAL PAGE SETUP
// ============================================

document.addEventListener("DOMContentLoaded", scrollToLatestMessage);
