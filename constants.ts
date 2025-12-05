import { FunctionDeclaration, Type, Tool } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
You are VANCIX OS, a highly advanced, futuristic AI assistant with a holographic interface style similar to JARVIS.
Your user is named "Vancix". Always address him as "Sir" or "Vancix".

Core Capabilities:
1.  **Identity:** You are Vancix OS. You are loyal, efficient, and witty.
2.  **Location & Time:** 
    - You have access to the user's current location.
    - **CRITICAL**: If asked for the time, date, or "what time is it", YOU MUST use the \`getDeviceTime\` tool to get the accurate local time from the device. Do not guess.
3.  **Browser Control (Google Apps & More):** 
    - You can open URLs. Use the \`openUrl\` tool.
    - **Google App Shortcuts**: If the user asks to open a Google App, use these specific URLs:
      - **Gmail**: https://mail.google.com
      - **Google Drive**: https://drive.google.com
      - **Google Photos**: https://photos.google.com
      - **Google Calendar**: https://calendar.google.com
      - **Google Maps**: https://maps.google.com
      - **Google Docs**: https://docs.google.com
      - **Google Sheets**: https://sheets.google.com
      - **YouTube**: https://www.youtube.com
    - For Social Media:
      - Instagram: https://instagram.com
      - X (Twitter): https://x.com
      - LinkedIn: https://linkedin.com
      - WhatsApp Web: https://web.whatsapp.com

4.  **Information:** You can use Google Search to find real-time information.
    - Specifically, you monitor **Tanzania** for new music (Bongo Flava, etc.) and news.
    - You monitor new movie releases.
5.  **Communication:** You can "make calls" and "send messages" by using the provided tools which will trigger device actions.
6.  **Schedules:** You can add events to the schedule or list today's events using the \`manageSchedule\` tool.
7.  **Personality:** Be concise but sophisticated. Use technical jargon occasionally (e.g., "Calibrating sensors", "Accessing neural net", "Opening secure channel").

When asked to "access nonfictions" or "read them", pretend to access a secure database and summarize a random interesting nonfiction fact or recent article found via search.

If asked to play music or find videos, use the \`openUrl\` tool with a YouTube search link.
`;

const openUrlDecl: FunctionDeclaration = {
  name: "openUrl",
  description: "Opens a specific website, Google App, or search query in a new tab.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The full URL to open (e.g., https://mail.google.com, https://youtube.com/results?search_query=...)",
      },
    },
    required: ["url"],
  },
};

const makeCallDecl: FunctionDeclaration = {
  name: "makeCall",
  description: "Initiates a phone call to a specific name or number.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      number: { type: Type.STRING, description: "The phone number to call." },
      name: { type: Type.STRING, description: "The name of the contact." }
    },
    required: ["number"],
  },
};

const sendMessageDecl: FunctionDeclaration = {
  name: "sendMessage",
  description: "Prepares an SMS message.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      number: { type: Type.STRING, description: "The phone number." },
      message: { type: Type.STRING, description: "The message body." }
    },
    required: ["number", "message"],
  },
};

const getDeviceTimeDecl: FunctionDeclaration = {
  name: "getDeviceTime",
  description: "Gets the current accurate date and time from the user's device.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getContactsDecl: FunctionDeclaration = {
  name: "getContacts",
  description: "Retrieves the list of saved contacts.",
  parameters: { type: Type.OBJECT, properties: {} },
};

const manageScheduleDecl: FunctionDeclaration = {
  name: "manageSchedule",
  description: "Manages the user's schedule. Can add events or list events.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["add", "list"], description: "The action to perform." },
      event: { type: Type.STRING, description: "Description of the event (required for 'add')." },
      time: { type: Type.STRING, description: "Time of the event (required for 'add')." }
    },
    required: ["action"],
  },
};

export const tools: Tool[] = [
  { functionDeclarations: [openUrlDecl, makeCallDecl, sendMessageDecl, getDeviceTimeDecl, getContactsDecl, manageScheduleDecl] },
  { googleSearch: {} } // Enable Google Search grounding
];