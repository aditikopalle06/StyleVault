const API_BASE = "http://localhost:5000";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}


/* =========================
   STATE
========================= */

let currentDate = new Date();

let calendarEvents = [];

let outfits = [];


/* =========================
   DOM ELEMENTS
========================= */

const calendarGrid =
    document.getElementById("calendarGrid");

const currentMonthLabel =
    document.getElementById("currentMonthLabel");

const previousMonth =
    document.getElementById("previousMonth");

const nextMonth =
    document.getElementById("nextMonth");

const eventModal =
    document.getElementById("eventModal");

const closeModal =
    document.getElementById("closeModal");

const cancelButton =
    document.getElementById("cancelButton");

const eventForm =
    document.getElementById("eventForm");

const eventIdInput =
    document.getElementById("eventId");

const eventDateInput =
    document.getElementById("eventDate");

const eventNameInput =
    document.getElementById("eventName");

const outfitSelect =
    document.getElementById("outfitSelect");

const eventTimeInput =
    document.getElementById("eventTime");

const selectedDateText =
    document.getElementById("selectedDateText");

const modalTitle =
    document.getElementById("modalTitle");

const deleteEventButton =
    document.getElementById("deleteEventButton");


/* =========================
   API HELPER
========================= */

async function apiRequest(url, options = {}) {

    const response = await fetch(
        `${API_BASE}${url}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                "Authorization":
                    `Bearer ${token}`,

                ...(options.headers || {})
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Something went wrong."
        );
    }

    return data;
}


/* =========================
   LOAD USER
========================= */

async function loadUser() {

    try {

        const response =
            await apiRequest(
                "/api/profile"
            );

        const user =
            response.user || response;

        if (
            user &&
            user.username
        ) {

            document.getElementById(
                "profileName"
            ).textContent =
                user.name;
        }

    } catch (error) {

        console.error(
            "Could not load user:",
            error
        );
    }
}


/* =========================
   LOAD OUTFITS
========================= */

async function loadOutfits() {

    try {

        const data =
            await apiRequest("/api/outfits");

        outfits =
            Array.isArray(data)
                ? data
                : data.outfits || [];

        populateOutfitSelect();

    } catch (error) {

        console.error(
            "Failed to load outfits:",
            error
        );

    }
}


/* =========================
   OUTFIT DROPDOWN
========================= */

function populateOutfitSelect() {

    outfitSelect.innerHTML =
        `<option value="">
            Select an outfit
        </option>`;

    outfits.forEach(outfit => {

        const option =
            document.createElement("option");

        option.value =
            outfit.outfit_id;

        option.textContent =
            `${outfit.outfit_name}${outfit.occasion ? " — " + outfit.occasion : ""}`;

        outfitSelect.appendChild(option);

    });
}


/* =========================
   LOAD CALENDAR EVENTS
========================= */

async function loadCalendarEvents() {

    try {

        const data =
            await apiRequest("/api/calendar");

        calendarEvents =
            Array.isArray(data)
                ? data
                : data.events || [];

        renderCalendar();

    } catch (error) {

        console.error(
            "Failed to load calendar events:",
            error
        );

        calendarEvents = [];

        renderCalendar();
    }
}


/* =========================
   RENDER CALENDAR
========================= */

function renderCalendar() {

    calendarGrid.innerHTML = "";

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();


    currentMonthLabel.textContent =
        currentDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    /* =========================
       PREVIOUS MONTH
    ========================= */

    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        const day =
            previousMonthDays - i;

        const cell =
            createDayCell(
                day,
                true,
                null,
                []
            );

        calendarGrid.appendChild(cell);
    }


    /* =========================
       CURRENT MONTH
    ========================= */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateObject =
            new Date(
                year,
                month,
                day
            );

        const dateString =
            formatDate(dateObject);


        const events =
            calendarEvents.filter(
                event =>
                    normalizeDate(
                        event.event_date
                    ) === dateString
            );


        const cell =
            createDayCell(
                day,
                false,
                dateString,
                events
            );

        calendarGrid.appendChild(cell);
    }


    /* =========================
       NEXT MONTH PADDING
    ========================= */

    const totalCells =
        calendarGrid.children.length;

    const remaining =
        42 - totalCells;

    for (
        let i = 1;
        i <= remaining;
        i++
    ) {

        const cell =
            createDayCell(
                i,
                true,
                null,
                []
            );

        calendarGrid.appendChild(cell);
    }
}


/* =========================
   CREATE DAY CELL
========================= */

function createDayCell(
    day,
    otherMonth,
    dateString,
    events = []
) {

    const cell =
        document.createElement("div");

    cell.className =
        "calendar-day";


    if (otherMonth) {

        cell.classList.add(
            "other-month"
        );
    }


    if (
        !otherMonth &&
        isToday(dateString)
    ) {

        cell.classList.add(
            "today"
        );
    }


    /* DAY HEADER */

    const header =
        document.createElement("div");

    header.className =
        "day-header";


    const dayNumber =
        document.createElement("span");

    dayNumber.className =
        "day-number";

    dayNumber.textContent =
        day;


    header.appendChild(
        dayNumber
    );


    if (!otherMonth) {

        const addButton =
            document.createElement("button");

        addButton.className =
            "add-day-button";

        addButton.type =
            "button";

        addButton.innerHTML =
            `<span class="material-symbols-outlined">
                add
            </span>`;


        addButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openAddModal(
                    dateString
                );
            }
        );


        header.appendChild(
            addButton
        );
    }


    cell.appendChild(
        header
    );


    /* EVENTS */

    events.forEach(
        calendarEvent => {

            const eventCard =
                createEventCard(
                    calendarEvent
                );

            cell.appendChild(
                eventCard
            );
        }
    );


    /* CLICK EMPTY DAY */

    if (!otherMonth) {

        cell.addEventListener(
            "click",
            () => {

                if (
                    events.length === 0
                ) {

                    openAddModal(
                        dateString
                    );
                }
            }
        );
    }


    return cell;
}


/* =========================
   CREATE EVENT CARD
========================= */

function createEventCard(
    calendarEvent
) {

    const card =
        document.createElement("div");

    card.className =
        "calendar-event";


    const outfit =
        outfits.find(
            item =>
                Number(
                    item.outfit_id
                ) ===
                Number(
                    calendarEvent.outfit_id
                )
        );


    let image = null;


    /*
       Try to get the first clothing
       item's image from the saved outfit.
    */

    if (
        outfit &&
        Array.isArray(outfit.items) &&
        outfit.items.length > 0
    ) {

        image =
            outfit.items[0].image;
    }


    if (image) {

        const imageElement =
            document.createElement("img");

        imageElement.className =
            "event-image";

        imageElement.src =
            image;

        imageElement.alt =
            calendarEvent.outfit_name ||
            "Planned outfit";

        card.appendChild(
            imageElement
        );

    } else {

        const placeholder =
            document.createElement("div");

        placeholder.className =
            "event-image placeholder-image";

        placeholder.innerHTML =
            `<span class="material-symbols-outlined">
                styler
            </span>`;

        card.appendChild(
            placeholder
        );
    }


    const info =
        document.createElement("div");

    info.className =
        "event-info";


    const eventName =
        document.createElement("div");

    eventName.className =
        "event-name";

    eventName.textContent =
        calendarEvent.event_name;


    const outfitName =
        document.createElement("div");

    outfitName.className =
        "event-outfit";

    outfitName.textContent =
        calendarEvent.outfit_name ||
        "Outfit";


    info.appendChild(
        eventName
    );

    info.appendChild(
        outfitName
    );


    if (calendarEvent.event_time) {

        const time =
            document.createElement("div");

        time.className =
            "event-time";

        time.textContent =
            formatTime(
                calendarEvent.event_time
            );

        info.appendChild(
            time
        );
    }


    card.appendChild(
        info
    );


    card.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            openEditModal(
                calendarEvent
            );
        }
    );


    return card;
}


/* =========================
   OPEN ADD MODAL
========================= */

function openAddModal(
    dateString
) {

    eventForm.reset();

    eventIdInput.value =
        "";

    eventDateInput.value =
        dateString;


    modalTitle.textContent =
        "Plan an Outfit";


    selectedDateText.textContent =
        formatDisplayDate(
            dateString
        );


    deleteEventButton.classList.remove(
        "show"
    );


    eventModal.classList.add(
        "show"
    );
}


/* =========================
   OPEN EDIT MODAL
========================= */

function openEditModal(
    calendarEvent
) {

    eventIdInput.value =
        calendarEvent.event_id;


    eventDateInput.value =
        normalizeDate(
            calendarEvent.event_date
        );


    eventNameInput.value =
        calendarEvent.event_name || "";


    outfitSelect.value =
        calendarEvent.outfit_id;


    eventTimeInput.value =
        calendarEvent.event_time
            ? String(
                calendarEvent.event_time
            ).slice(0, 5)
            : "";


    modalTitle.textContent =
        "Edit Planned Outfit";


    selectedDateText.textContent =
        formatDisplayDate(
            normalizeDate(
                calendarEvent.event_date
            )
        );


    deleteEventButton.classList.add(
        "show"
    );


    eventModal.classList.add(
        "show"
    );
}


/* =========================
   CLOSE MODAL
========================= */

function closeEventModal() {

    eventModal.classList.remove(
        "show"
    );
}


/* =========================
   SAVE EVENT
========================= */

eventForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const eventId =
            eventIdInput.value;


        const payload = {

            outfit_id:
                Number(
                    outfitSelect.value
                ),

            event_name:
                eventNameInput.value.trim(),

            event_date:
                eventDateInput.value,

            event_time:
                eventTimeInput.value || null
        };


        if (
            !payload.outfit_id ||
            !payload.event_name ||
            !payload.event_date
        ) {

            alert(
                "Please fill in all required fields."
            );

            return;
        }


        try {

            if (eventId) {

                await apiRequest(
                    `/api/calendar/${eventId}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            } else {

                await apiRequest(
                    "/api/calendar",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );
            }


            closeEventModal();

            await loadCalendarEvents();

        } catch (error) {

            console.error(
                error
            );

            alert(
                error.message
            );
        }

    }
);


/* =========================
   DELETE EVENT
========================= */

deleteEventButton.addEventListener(
    "click",
    async () => {

        const eventId =
            eventIdInput.value;


        if (!eventId) {
            return;
        }


        const confirmed =
            confirm(
                "Remove this planned outfit from the calendar?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await apiRequest(
                `/api/calendar/${eventId}`,
                {
                    method: "DELETE"
                }
            );


            closeEventModal();

            await loadCalendarEvents();

        } catch (error) {

            console.error(
                error
            );

            alert(
                error.message
            );
        }

    }
);


/* =========================
   MONTH NAVIGATION
========================= */

previousMonth.addEventListener(
    "click",
    () => {

        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        renderCalendar();
    }
);


nextMonth.addEventListener(
    "click",
    () => {

        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        renderCalendar();
    }
);


/* =========================
   MODAL BUTTONS
========================= */

closeModal.addEventListener(
    "click",
    closeEventModal
);


cancelButton.addEventListener(
    "click",
    closeEventModal
);


eventModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            eventModal
        ) {

            closeEventModal();
        }
    }
);


/* =========================
   DATE HELPERS
========================= */

/*
    IMPORTANT:
    Calendar dates are treated as
    local calendar dates, NOT UTC
    timestamps.
*/

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function normalizeDate(value) {

    if (!value) {
        return "";
    }


    const valueString =
        String(value);


    /*
       If PostgreSQL returns exactly
       YYYY-MM-DD, keep it exactly as is.
    */

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(valueString)
    ) {

        return valueString;
    }


    /*
       If PostgreSQL returns a timestamp,
       only use its date portion.
       Do NOT use new Date(value),
       because that can shift the date
       because of timezone conversion.
    */

    return valueString.slice(
        0,
        10
    );
}


function isToday(dateString) {

    const today =
        new Date();


    return (
        formatDate(today) ===
        dateString
    );
}


function formatDisplayDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    /*
       Add T00:00:00 intentionally so
       the displayed calendar date stays
       the same in the user's local timezone.
    */

    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


function formatTime(time) {

    if (!time) {
        return "";
    }


    const parts =
        String(time).split(":");


    const hours =
        Number(
            parts[0]
        );


    const minutes =
        parts[1] || "00";


    const suffix =
        hours >= 12
            ? "PM"
            : "AM";


    const displayHour =
        hours % 12 || 12;


    return `${displayHour}:${minutes} ${suffix}`;
}


/* =========================
   NAVIGATION
========================= */

document
    .querySelectorAll(".nav-item")
    .forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    href === "#"
                ) {

                    event.preventDefault();
                }
            }
        );
    });


/* =========================
   INITIALIZE
========================= */

async function initialize() {

    await loadUser();

    await loadOutfits();

    await loadCalendarEvents();

}


initialize();