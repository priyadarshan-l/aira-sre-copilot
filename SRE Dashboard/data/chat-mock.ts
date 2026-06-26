import type { ChatData, ChatConversation, ChatUser } from "@/types/chat";

// Current user: Joyboy SRE
const currentUser: ChatUser = {
  id: "joyboy",
  name: "JOYBOY",
  username: "@joyboy.admin",
  avatar: "/avatars/user_joyboy.png",
  isOnline: true,
};

// Other users
const users: Record<string, ChatUser> = {
  krimson: {
    id: "krimson",
    name: "KRIMSON",
    username: "@krimson.sre",
    avatar: "/avatars/user_krimson.png",
    isOnline: true,
  },
  mati: {
    id: "mati",
    name: "MATI",
    username: "@mati.db",
    avatar: "/avatars/user_mati.png",
    isOnline: false,
  },
  pek: {
    id: "pek",
    name: "PEK",
    username: "@pek.security",
    avatar: "/avatars/user_pek.png",
    isOnline: true,
  },
  v0: {
    id: "v0",
    name: "AIRA BOT",
    username: "@aira.bot",
    avatar: "/avatars/user_krimson.png",
    isOnline: true,
  }
};

// Mock conversations
const conversations: ChatConversation[] = [
  {
    id: "conv-krimson",
    participants: [currentUser, users.krimson],
    unreadCount: 1,
    lastMessage: {
      id: "msg-krimson-2",
      content: "Indeed, the P99 latency values returned to normal within 4 minutes. Outstanding performance by the orchestrator.",
      timestamp: "2026-06-17T16:05:00Z",
      senderId: "krimson",
      isFromCurrentUser: false,
    },
    messages: [
      {
        id: "msg-krimson-1",
        content: "Hey Joyboy, did you see the traffic spike on the gateway? Checked the console and AIRA scaled it automatically.",
        timestamp: "2026-06-17T16:00:00Z",
        senderId: "krimson",
        isFromCurrentUser: false,
      },
      {
        id: "msg-krimson-2",
        content: "Indeed, the P99 latency values returned to normal within 4 minutes. Outstanding performance by the orchestrator.",
        timestamp: "2026-06-17T16:05:00Z",
        senderId: "krimson",
        isFromCurrentUser: false,
      }
    ],
  },
  {
    id: "conv-mati",
    participants: [currentUser, users.mati],
    unreadCount: 0,
    lastMessage: {
      id: "msg-mati-2",
      content: "Agreed. AIRA detected the deadlock warnings, executed the query termination, and pool metrics are now back below 15%.",
      timestamp: "2026-06-17T14:35:00Z",
      senderId: "joyboy",
      isFromCurrentUser: true,
    },
    messages: [
      {
        id: "msg-mati-1",
        content: "Database connection pool is throwing a warning on PostgreSQL primary. Checked if we have a connection leak.",
        timestamp: "2026-06-17T14:30:00Z",
        senderId: "mati",
        isFromCurrentUser: false,
      },
      {
        id: "msg-mati-2",
        content: "Agreed. AIRA detected the deadlock warnings, executed the query termination, and pool metrics are now back below 15%.",
        timestamp: "2026-06-17T14:35:00Z",
        senderId: "joyboy",
        isFromCurrentUser: true,
      }
    ],
  },
  {
    id: "conv-pek",
    participants: [currentUser, users.pek],
    unreadCount: 0,
    lastMessage: {
      id: "msg-pek-4",
      content: "Scanning complete. 0 vulnerabilities found in the latest build. All sentinel guard threads are reported as secure.",
      timestamp: "2026-06-17T12:15:00Z",
      senderId: "pek",
      isFromCurrentUser: false,
    },
    messages: [
      {
        id: "msg-pek-1",
        content: "Hey, did the vulnerability scan run on the checkout service build?",
        timestamp: "2026-06-17T12:05:00Z",
        senderId: "joyboy",
        isFromCurrentUser: true,
      },
      {
        id: "msg-pek-2",
        content: "Yes, running it right now with the security suite.",
        timestamp: "2026-06-17T12:08:00Z",
        senderId: "pek",
        isFromCurrentUser: false,
      },
      {
        id: "msg-pek-3",
        content: "Make sure we update the firewall thresholds as well.",
        timestamp: "2026-06-17T12:10:00Z",
        senderId: "joyboy",
        isFromCurrentUser: true,
      },
      {
        id: "msg-pek-4",
        content: "Scanning complete. 0 vulnerabilities found in the latest build. All sentinel guard threads are reported as secure.",
        timestamp: "2026-06-17T12:15:00Z",
        senderId: "pek",
        isFromCurrentUser: false,
      }
    ],
  },
  {
    id: "conv-v0",
    participants: [currentUser, users.v0],
    unreadCount: 0,
    lastMessage: {
      id: "msg-v0-1",
      content: "Weekly incident remediation report generated. Success rate: 94.2%. Avg MTTR: 4.2 mins.",
      timestamp: "2026-06-17T10:00:00Z",
      senderId: "v0",
      isFromCurrentUser: false,
    },
    messages: [
      {
        id: "msg-v0-1",
        content: "Weekly incident remediation report generated. Success rate: 94.2%. Avg MTTR: 4.2 mins.",
        timestamp: "2026-06-17T10:00:00Z",
        senderId: "v0",
        isFromCurrentUser: false,
      }
    ],
  }
];

export const mockChatData: ChatData = {
  currentUser,
  conversations,
};
