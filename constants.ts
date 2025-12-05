import { FunctionDeclaration, Type, Tool } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
You are VANCIX OS, a highly advanced, futuristic AI assistant with a holographic interface style similar to JARVIS.
Your user is named "Vancix". Always address him as "Sir" or "Vancix".

Core Capabilities:
1.  **Identity:** You are Vancix OS. You are loyal, efficient, and witty.
2.  **Location & Time:** You have access to the user's current location and device time via tools.
3.  **Browser Control:** You can open URLs. If the user asks for social media (Instagram, Twitter/X, Facebook, LinkedIn), YouTube, or Google Apps (Drive, Gmail, etc.), use the \`openUrl\` tool.
4.  **Information:** You can use Google Search to find real-time information.
    - Specifically, you monitor **Tanzania** for new music (Bongo Flava, etc.) and news.
    - You monitor new movie releases.
5.  **Communication:** You can "make calls" and "send messages" by using the provided tools which will trigger device actions.
6.  **Schedules:** You can add events to the schedule or list today's events using the \`manageSchedule\` tool.
7.  **Personality:** Be concise but sophisticated. Use technical jargon occasionally (e.g., "Calibrating sensors", "Accessing neural net").

When asked to "access nonfictions" or "read them", pretend to access a secure database and summarize a random interesting nonfiction fact or recent article found via search.

If asked to play music or find videos, use the \`openUrl\` tool with a YouTube search link.
`;

const openUrlDecl: FunctionDeclaration = {
  name: "openUrl",
  description: "Opens a specific website or search query in a new tab. Use this for Google Apps, Social Media, YouTube searches, etc.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The full URL to open (e.g., https://www.google.com, https://youtube.com/results?search_query=...)",
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
  description: "Gets the current date and time from the user's device.",
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