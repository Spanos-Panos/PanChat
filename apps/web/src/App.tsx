import { useState, useEffect, useLayoutEffect, useRef, useMemo, Fragment } from "react";
import type { ChangeEvent, FormEvent } from "react";
import styles from "./App.module.css";
import { apiFetch , apiUploadAvatar , avatarSrc } from "./lib/api";
import { io, type Socket } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Typing signal tuning. We send a "start" heartbeat at most every
// HEARTBEAT_MS while actively typing, send "stop" after IDLE_STOP_MS of no
// keystrokes, and the receiver auto-clears after SAFETY_CLEAR_MS in case a
// "stop" is ever dropped.
const TYPING_HEARTBEAT_MS = 2500;
const TYPING_IDLE_STOP_MS = 3000;
const TYPING_SAFETY_CLEAR_MS = 6000;

// Consecutive messages from the same sender within GROUP_GAP_MIN are grouped
// (single avatar + one timestamp). A time separator is shown when the gap
// between two messages exceeds SEPARATOR_GAP_MIN.
const GROUP_GAP_MIN = 5;
const SEPARATOR_GAP_MIN = 30;

function gapMinutes(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

type TaskFilter = "open" | "cleared" | "all";

function taskOrderStorageKey(userId: string) {
  return `panchat-task-order-${userId}`;
}

function loadTaskOrder(userId: string): string[] {
  try {
    const raw = localStorage.getItem(taskOrderStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveTaskOrder(userId: string, order: string[]) {
  localStorage.setItem(taskOrderStorageKey(userId), JSON.stringify(order));
}

function mergeTaskOrder(fetchedIds: string[], savedOrder: string[]): string[] {
  const fetchedSet = new Set(fetchedIds);
  const kept = savedOrder.filter((id) => fetchedSet.has(id));
  const newIds = fetchedIds.filter((id) => !kept.includes(id));
  return [...newIds, ...kept];
}

function formatTaskAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSeparator(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = formatClockTime(iso);

  if (date.toDateString() === now.toDateString()) return time;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${time}`;
  }

  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${day}, ${time}`;
}

type AuthUser = {
  id: string;
  email: string;
  username?: string | null;
  displayName?: string | null;
  profileCompleted: boolean;
  avatarUrl?: string | null;
};

type MeResponse = {
  user: AuthUser;
};

type LoginResponse = {
  user: AuthUser;
};

type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type UserResponse = {
  users: PublicUser[];
};

type ThreadResponse = {
  thread: {
    id: string;
    peer: PublicUser;
  };
};

type TaskOnMessage = {
  id: string;
  body: string;
  status: "open" | "cleared" | "deleted";
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  hasTask?: boolean;
  task?: TaskOnMessage;
  deletedForEveryone?: boolean;
};

type MessagesResponse = {
  messages: ChatMessage[];
};

type InboxTask = {
  id: string;
  body: string;
  status: "open" | "cleared" | "deleted";
  createdAt: string;
  updatedAt: string;
  message: {
    id: string;
    threadId: string;
    body: string;
    senderId: string;
    createdAt: string;
  };
};

function sortInboxTasks(tasks: InboxTask[], order: string[]): InboxTask[] {
  const index = new Map(order.map((id, i) => [id, i]));
  return [...tasks].sort((a, b) => {
    const ia = index.get(a.id);
    const ib = index.get(b.id);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

type AuthView = "login" | "register";

function AuthBrand() {
  return (
    <aside className={styles.authBrand}>
      <div className={styles.authBrandGlow} aria-hidden="true" />
      <div className={styles.authBrandInner}>
        <span className={styles.logoMark}>P</span>
        <h1 className={styles.logoWordmark}>PanChat</h1>
        <p className={styles.authTagline}>
          One-to-one chat with tasks, presence, and live updates — built for
          focused conversations.
        </p>
        <ul className={styles.authFeatureList}>
          <li>Real-time messages & typing</li>
          <li>Send tasks only they can see</li>
          <li>Avatars & online status</li>
        </ul>
      </div>
    </aside>
  );
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ThreadResponse["thread"] | null>(null);
  const activeThreadRef = useRef(activeThread);
  activeThreadRef.current = activeThread;
  const socketRef = useRef<Socket | null>(null);
  const messagesListRef = useRef<HTMLUListElement>(null);
  const messagesAnchorRef = useRef<HTMLLIElement>(null);
  const scrollIntentRef = useRef<"jump" | "smooth">("jump");
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const typingClearTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const [openingChat, setOpeningChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileBirthDate, setProfileBirthDate] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [attachTask, setAttachTask] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [inboxTasks, setInboxTasks] = useState<InboxTask[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("open");
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [peoplePanelOpen, setPeoplePanelOpen] = useState(true);
  const [tasksPanelOpen, setTasksPanelOpen] = useState(true);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarBust, setAvatarBust] = useState<Record<string, number>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  // userIds currently typing to me (keyed by the typer, works across threads
  // since chat is 1-to-1, so it powers both the chat panel and People list).
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadMe() {
      try {
        const data = await apiFetch<MeResponse>("/api/v1/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    loadMe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const socket: Socket = io(API_BASE, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error", err.message);
    });

    socket.on("presence:sync", (payload: { onlineUserIds: string[] }) => {
      setOnlineUserIds(new Set(payload.onlineUserIds));
    });

    socket.on("user:online", (payload: { userId: string }) => {
      setOnlineUserIds((prev) => new Set(prev).add(payload.userId));
    });

    socket.on("user:offline", (payload: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    });

    socket.on(
      "typing:update",
      (payload: { threadId: string; userId: string; isTyping: boolean }) => {
        const { userId, isTyping } = payload;
        const timers = typingClearTimersRef.current;

        if (timers[userId]) {
          clearTimeout(timers[userId]);
          delete timers[userId];
        }

        setTypingUserIds((prev) => {
          const next = new Set(prev);
          if (isTyping) next.add(userId);
          else next.delete(userId);
          return next;
        });

        if (isTyping) {
          // Safety net: clear the indicator if a "stop" never arrives.
          timers[userId] = setTimeout(() => {
            setTypingUserIds((prev) => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
            delete timers[userId];
          }, TYPING_SAFETY_CLEAR_MS);
        }
      },
    );

    socket.on(
      "message:new",
      (payload: { threadId: string; message: ChatMessage }) => {
        if (activeThreadRef.current?.id !== payload.threadId) return;

        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      },
    );

    socket.on(
      "message:deleted",
      (payload: { threadId: string; messageId: string }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? {
                  ...m,
                  deletedForEveryone: true,
                  body: "",
                  task: undefined,
                  hasTask: false,
                }
              : m,
          ),
        );
        setInboxTasks((prev) =>
          prev.filter((t) => t.message.id !== payload.messageId),
        );
      },
    );

    socket.on(
      "user:updated",
      (updated: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        version?: number;
      }) => {
        const version = updated.version ?? Date.now();
        setAvatarBust((prev) => ({ ...prev, [updated.id]: version }));

        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
        );

        setActiveThread((prev) => {
          if (!prev || prev.peer.id !== updated.id) return prev;
          return { ...prev, peer: { ...prev.peer, ...updated } };
        });

        setUser((prev) =>
          prev?.id === updated.id
            ? { ...prev, avatarUrl: updated.avatarUrl }
            : prev,
        );
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      Object.values(typingClearTimersRef.current).forEach(clearTimeout);
      typingClearTimersRef.current = {};
    };
  }, [user?.id]);

  useLayoutEffect(() => {
    const list = messagesListRef.current;
    const anchor = messagesAnchorRef.current;
    if (!list || !anchor || messages.length === 0) return;

    const toBottom = (smooth: boolean) => {
      anchor.scrollIntoView({ block: "end", behavior: smooth ? "smooth" : "auto" });
    };

    if (scrollIntentRef.current === "jump") {
      toBottom(false);
      requestAnimationFrame(() => toBottom(false));

      const retryTimers = [50, 150, 400].map((ms) =>
        setTimeout(() => toBottom(false), ms),
      );

      const ro = new ResizeObserver(() => toBottom(false));
      ro.observe(list);

      const stopObserving = setTimeout(() => ro.disconnect(), 600);

      scrollIntentRef.current = "smooth";

      return () => {
        retryTimers.forEach(clearTimeout);
        clearTimeout(stopObserving);
        ro.disconnect();
      };
    }

    toBottom(true);
  }, [messages]);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      return;
    }

    async function loadUsers() {
      try {
        const data = await apiFetch<UserResponse>("/api/v1/users");
        setUsers(data.users);
        setUsersError(null);
      } catch (err) {
        setUsers([]);
        setUsersError(
          err instanceof Error ? err.message : "Failed to load users",
        );
      }
    }

    loadUsers();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTaskOrder([]);
      return;
    }
    setTaskOrder(loadTaskOrder(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setInboxTasks([]);
      setOpenTaskCount(0);
      return;
    }

    async function loadInbox() {
      try {
        const statusQuery =
          taskFilter === "all" ? "" : `?status=${taskFilter}`;
        const data = await apiFetch<{ tasks: InboxTask[] }>(
          `/api/v1/tasks/inbox${statusQuery}`,
        );
        setInboxTasks(data.tasks);
        setTaskOrder((prev) => {
          const merged = mergeTaskOrder(
            data.tasks.map((t) => t.id),
            prev,
          );
          saveTaskOrder(user!.id, merged);
          return merged;
        });

        if (taskFilter === "open") {
          setOpenTaskCount(data.tasks.length);
        } else {
          const openData = await apiFetch<{ tasks: InboxTask[] }>(
            "/api/v1/tasks/inbox?status=open",
          );
          setOpenTaskCount(openData.tasks.length);
        }
      } catch {
        setInboxTasks([]);
        setOpenTaskCount(0);
      }
    }

    loadInbox();
  }, [user, messages, taskFilter]);

  useEffect(() => {
    // Reset our own typing state so a burst in a previous thread does not
    // suppress the "start" signal in the newly opened one.
    typingActiveRef.current = false;
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    if (!activeThread) {
      setMessages([]);
      return;
    }

    const threadId = activeThread.id;
    setMessages([]);
    scrollIntentRef.current = "jump";

    async function loadMessages() {
      try {
        const data = await apiFetch<MessagesResponse>(
          `/api/v1/threads/${threadId}/messages`,
        );
        if (activeThreadRef.current?.id !== threadId) return;

        scrollIntentRef.current = "jump";
        setMessages(data.messages);
        setMessagesError(null);
      } catch (err) {
        if (activeThreadRef.current?.id !== threadId) return;

        setMessages([]);
        setMessagesError(
          err instanceof Error ? err.message : "Failed to load messages",
        );
      }
    }

    loadMessages();
  }, [activeThread]);

  function stopTypingSignal() {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;

    const threadId = activeThreadRef.current?.id;
    if (!threadId || !socketRef.current) return;
    socketRef.current.emit("typing:stop", { threadId });
  }

  function handleMessageTextChange(value: string) {
    setMessageText(value);

    const threadId = activeThreadRef.current?.id;
    if (!threadId || !socketRef.current) return;

    if (!value.trim()) {
      stopTypingSignal();
      return;
    }

    // Emit a "start" heartbeat at most every TYPING_HEARTBEAT_MS rather than
    // on every keystroke, so the peer's indicator stays alive during long
    // bursts without flooding the socket + DB. The idle timer sends "stop".
    const now = Date.now();
    if (
      !typingActiveRef.current ||
      now - lastTypingEmitRef.current > TYPING_HEARTBEAT_MS
    ) {
      typingActiveRef.current = true;
      lastTypingEmitRef.current = now;
      socketRef.current.emit("typing:start", { threadId });
    }
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }
    typingStopTimerRef.current = setTimeout(stopTypingSignal, TYPING_IDLE_STOP_MS);
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!activeThread) return;

    const text = messageText.trim();

    const trimmedTask = taskText.trim();

    if (attachTask && !trimmedTask) {
      setMessagesError("Task text is required when attach task is checked");
      return;
    }

    if (!text) return;

    setSending(true);
    setMessagesError(null);

    try {
      const data = await apiFetch<{ message: ChatMessage }>(
        `/api/v1/threads/${activeThread.id}/messages`,
        {
          method: "POST",
          body: {
            body: text,
            ...(attachTask && trimmedTask
              ? { task: { body: trimmedTask } }
              : {}),
          },
        },
      );
      setMessages((prev) => [...prev, data.message]);
      setMessageText("");
      setAttachTask(false);
      setTaskText("");
      stopTypingSignal();
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : "Failed to send message",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleUpdateTask(
    taskId: string,
    status: "cleared" | "deleted",
  ) {
    setUpdatingTaskId(taskId);
    try {
      const data = await apiFetch<{ task: TaskOnMessage }>(
        `/api/v1/tasks/${taskId}`,
        {
          method: "PATCH",
          body: { status },
        },
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.task?.id === taskId ? { ...m, task: data.task } : m,
        ),
      );

      setInboxTasks((prev) => {
        if (status === "deleted") {
          return prev.filter((t) => t.id !== taskId);
        }
        if (taskFilter === "open" && status === "cleared") {
          return prev.filter((t) => t.id !== taskId);
        }
        return prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: data.task.status,
                updatedAt: data.task.updatedAt,
              }
            : t,
        );
      });

      if (status === "cleared" || status === "deleted") {
        setOpenTaskCount((count) => Math.max(0, count - 1));
      }

      setTaskOrder((prev) => {
        const next = prev.filter((id) => id !== taskId);
        if (user) saveTaskOrder(user.id, next);
        return next;
      });
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : "Failed to update task",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  function persistTaskOrder(nextOrder: string[]) {
    setTaskOrder(nextOrder);
    if (user) saveTaskOrder(user.id, nextOrder);
  }

  function reorderTasks(dragId: string, targetId: string) {
    if (dragId === targetId || taskFilter !== "open") return;

    const orderedIds = sortInboxTasks(inboxTasks, taskOrder).map((t) => t.id);
    const from = orderedIds.indexOf(dragId);
    const to = orderedIds.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...orderedIds];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    persistTaskOrder(next);
  }

  function moveTask(taskId: string, direction: "up" | "down") {
    if (taskFilter !== "open") return;

    const orderedIds = sortInboxTasks(inboxTasks, taskOrder).map((t) => t.id);
    const index = orderedIds.indexOf(taskId);
    if (index < 0) return;

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= orderedIds.length) return;

    const next = [...orderedIds];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    persistTaskOrder(next);
  }

  function taskSenderLabel(senderId: string): string {
    const sender = users.find((u) => u.id === senderId);
    return sender?.displayName ?? sender?.username ?? "Someone";
  }

  async function handleDeleteMessage(
    messageId: string,
    scope: "me" | "everyone",
  ) {
    setMenuMessageId(null);
    try {
      await apiFetch(`/api/v1/messages/${messageId}?scope=${scope}`, {
        method: "DELETE",
      });

      if (scope === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  deletedForEveryone: true,
                  body: "",
                  task: undefined,
                  hasTask: false,
                }
              : m,
          ),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }

      setInboxTasks((prev) => prev.filter((t) => t.message.id !== messageId));
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : "Failed to delete message",
      );
    }
  }

  async function openChat(peerUserId: string) {
    setOpeningChat(true);
    setUsersError(null);

    try {
      const data = await apiFetch<ThreadResponse>("/api/v1/threads", {
        method: "POST",
        body: { peerUserId },
      });

      setActiveThread(data.thread);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Failed to open chat");
    } finally {
      setOpeningChat(false);
    }
  }

  async function openChatFromTask(task: InboxTask) {
    await openChat(task.message.senderId);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function HandleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>("/api/v1/auth/register", {
        method: "POST",
        body: { email, password },
      });
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>("/api/v1/auth/me/profile", {
        method: "PATCH",
        body: {
          username: profileUsername,
          displayName: profileDisplayName || undefined,
          birthDate: profileBirthDate || undefined,
        },
      });
      setUser(data.user);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setUploadingAvatar(true);

    try {
      const data = await apiUploadAvatar(file);
      const version = Date.now();
      setAvatarBust((prev) => ({ ...prev, [data.user.id]: version }));
      setUser(data.user);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.user.id
            ? { ...u, avatarUrl: data.user.avatarUrl ?? null }
            : u,
        ),
      );
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Failed to upload avatar",
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function HandleLogout() {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch (err) {
      //cookie may be already be gone
    }

    setUser(null);
    setActiveThread(null);
    setMessages([]);
    setMessageText("");
    setUsers([]);
    setError(null);
    setUsersError(null);
    setMessagesError(null);
    setAttachTask(false);
    setTaskText("");
    setInboxTasks([]);
    setOnlineUserIds(new Set());
    setTypingUserIds(new Set());
    Object.values(typingClearTimersRef.current).forEach(clearTimeout);
    typingClearTimersRef.current = {};
  }

  const displayedTasks = useMemo(
    () => sortInboxTasks(inboxTasks, taskOrder),
    [inboxTasks, taskOrder],
  );

  if (checkingSession) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authShell}>
          <AuthBrand />
          <div className={styles.authCard}>
            <div className={styles.authCardHeader}>
              <h2 className={styles.authTitle}>Loading</h2>
              <p className={styles.authSubtitle}>Checking your session…</p>
            </div>
            <div className={styles.loadingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && !user.profileCompleted) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authShell}>
          <AuthBrand />
          <div className={styles.authCard}>
            <div className={styles.authCardHeader}>
              <span className={styles.authStep}>Step 1 of 1</span>
              <h2 className={styles.authTitle}>Set up your profile</h2>
              <p className={styles.authSubtitle}>
                Signed in as <strong>{user.email}</strong>. Pick a username to
                join PanChat.
              </p>
            </div>

            <form className={styles.authForm} onSubmit={handleCompleteProfile}>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelText}>Username</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder="panos"
                  autoComplete="username"
                />
              </label>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelText}>
                  Display name <span className={styles.optional}>(optional)</span>
                </span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  placeholder="Panos"
                  autoComplete="name"
                />
              </label>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelText}>
                  Birth date <span className={styles.optional}>(optional)</span>
                </span>
                <input
                  className={styles.fieldInput}
                  type="date"
                  value={profileBirthDate}
                  onChange={(e) => setProfileBirthDate(e.target.value)}
                />
              </label>
              {profileError && (
                <p className={styles.errorBanner}>{profileError}</p>
              )}
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loading}
              >
                {loading ? "Saving…" : "Continue to PanChat"}
              </button>
            </form>

            <button
              type="button"
              className={styles.btnText}
              onClick={HandleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    const peerIsTyping = activeThread
      ? typingUserIds.has(activeThread.peer.id)
      : false;
    const peerAvatar = activeThread
      ? avatarSrc(
          activeThread.peer.avatarUrl,
          avatarBust[activeThread.peer.id],
        )
      : null;
    const peerInitial = activeThread
      ? (activeThread.peer.displayName ?? activeThread.peer.username)
          .charAt(0)
          .toUpperCase()
      : "";
    const peerName =
      activeThread?.peer.displayName ?? activeThread?.peer.username ?? "them";
    const otherUsers = users.filter((u) => u.id !== user.id);

    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            <span className={styles.headerLogoMark}>P</span>
            <h1 className={styles.headerTitle}>PanChat</h1>
          </div>
          <div className={styles.headerProfile}>
            {avatarSrc(user.avatarUrl, avatarBust[user.id]) ? (
              <img
                className={styles.avatar}
                src={avatarSrc(user.avatarUrl, avatarBust[user.id])!}
                alt=""
              />
            ) : (
              <span className={styles.avatarPlaceholder}>
                {(user.displayName ?? user.username ?? user.email)
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
            <div className={styles.headerProfileText}>
              <span className={styles.headerUserName}>
                {user.displayName ?? user.username ?? user.email}
              </span>
              <label className={styles.avatarUploadLabel}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  hidden
                />
                {uploadingAvatar ? "Uploading…" : "Change photo"}
              </label>
              {avatarError && (
                <p className={styles.errorText}>{avatarError}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={HandleLogout}
          >
            Log out
          </button>
        </header>

        <div className={styles.body}>
          <aside
            className={`${styles.sidePanel} ${styles.peoplePanel} ${!peoplePanelOpen ? styles.sidePanelCollapsed : ""}`}
          >
            <div className={styles.sidePanelHeader}>
              {peoplePanelOpen && (
                <>
                  <span className={styles.sidePanelTitle}>
                    People
                    <span className={styles.sidebarSectionCount}>
                      {otherUsers.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={styles.panelToggleBtn}
                    onClick={() => setPeoplePanelOpen(false)}
                    aria-label="Collapse people panel"
                  >
                    ‹
                  </button>
                </>
              )}
            </div>

            {peoplePanelOpen ? (
              <div className={`${styles.sidePanelBody} ${styles.scrollHidden}`}>
                {usersError && <p className={styles.errorText}>{usersError}</p>}
                <ul className={styles.userList}>
                  {otherUsers.map((u) => {
                    const isActive = activeThread?.peer.id === u.id;
                    const isOnline = onlineUserIds.has(u.id);
                    const isTyping = typingUserIds.has(u.id);
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          className={`${styles.userButton} ${isActive ? styles.userButtonActive : ""} ${!isOnline ? styles.userButtonOffline : ""}`}
                          disabled={openingChat}
                          onClick={() => openChat(u.id)}
                        >
                          <span className={styles.userAvatarWrap}>
                            {avatarSrc(u.avatarUrl, avatarBust[u.id]) ? (
                              <img
                                className={styles.avatarSmall}
                                src={avatarSrc(u.avatarUrl, avatarBust[u.id])!}
                                alt=""
                              />
                            ) : (
                              <span className={styles.avatarSmallPlaceholder}>
                                {(u.displayName ?? u.username)
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                            <span
                              className={`${styles.presenceDot} ${isOnline ? styles.presenceOnline : styles.presenceOffline}`}
                              title={isOnline ? "Online" : "Offline"}
                            />
                          </span>
                          <span className={styles.userMeta}>
                            <span className={styles.userButtonName}>
                              {u.displayName ?? u.username}
                            </span>
                            {isTyping ? (
                              <span className={styles.userTyping}>
                                typing
                                <span className={styles.typingDots}>
                                  <span>.</span>
                                  <span>.</span>
                                  <span>.</span>
                                </span>
                              </span>
                            ) : (
                              <span className={styles.userSubtitle}>
                                {isOnline ? "Active now" : "Offline"}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <button
                type="button"
                className={styles.sidePanelRail}
                onClick={() => setPeoplePanelOpen(true)}
                aria-label="Expand people panel"
              >
                <span className={styles.sidePanelRailLabel}>People</span>
                {otherUsers.length > 0 && (
                  <span className={styles.sidePanelRailCount}>
                    {otherUsers.length}
                  </span>
                )}
              </button>
            )}
          </aside>

          <section className={styles.chatPanel}>
            {!activeThread ? (
              <div className={styles.chatEmpty}>
                <div className={styles.chatEmptyInner}>
                  <span className={styles.chatEmptyIcon} aria-hidden="true" />
                  <p className={styles.chatEmptyTitle}>Select someone to chat</p>
                  <p className={styles.chatEmptyHint}>
                    Pick a person from the left panel to start a conversation
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.chatWindow}>
                <div className={styles.chatHeaderRow}>
                  {avatarSrc(
                    activeThread.peer.avatarUrl,
                    avatarBust[activeThread.peer.id],
                  ) ? (
                    <img
                      className={styles.avatar}
                      src={
                        avatarSrc(
                          activeThread.peer.avatarUrl,
                          avatarBust[activeThread.peer.id],
                        )!
                      }
                      alt=""
                    />
                  ) : (
                    <span className={styles.avatarPlaceholder}>
                      {(activeThread.peer.displayName ??
                        activeThread.peer.username)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                  <div className={styles.chatHeaderInfo}>
                    <h2 className={styles.chatHeader}>
                      {activeThread.peer.displayName ??
                        activeThread.peer.username}
                    </h2>
                    {peerIsTyping ? (
                      <span className={styles.typingIndicator}>
                        typing
                        <span className={styles.typingDots}>
                          <span>.</span>
                          <span>.</span>
                          <span>.</span>
                        </span>
                      </span>
                    ) : onlineUserIds.has(activeThread.peer.id) ? (
                      <span className={styles.statusOnline}>Active now</span>
                    ) : (
                      <span className={styles.statusOffline}>Offline</span>
                    )}
                  </div>
                </div>

                {messagesError && (
                  <p className={styles.chatErrorBanner}>{messagesError}</p>
                )}

                <ul
                  className={`${styles.messages} ${styles.scrollHidden}`}
                  ref={messagesListRef}
                >
                  {messages.map((m, i) => {
                    const isMine = m.senderId === user.id;
                    const prev = messages[i - 1];
                    const next = messages[i + 1];

                    const showSeparator =
                      !prev ||
                      gapMinutes(prev.createdAt, m.createdAt) > SEPARATOR_GAP_MIN;
                    const isGroupStart =
                      !prev ||
                      prev.senderId !== m.senderId ||
                      gapMinutes(prev.createdAt, m.createdAt) > GROUP_GAP_MIN;
                    const isGroupEnd =
                      !next ||
                      next.senderId !== m.senderId ||
                      gapMinutes(m.createdAt, next.createdAt) > GROUP_GAP_MIN;

                    return (
                      <Fragment key={m.id}>
                        {showSeparator && (
                          <li className={styles.daySeparator}>
                            <span>{formatSeparator(m.createdAt)}</span>
                          </li>
                        )}
                        <li
                          className={`${styles.messageRow} ${isMine ? styles.messageRowMine : ""} ${isGroupStart ? styles.groupStart : ""}`}
                        >
                          {!isMine &&
                            (isGroupEnd ? (
                              peerAvatar ? (
                                <img
                                  className={styles.messageAvatar}
                                  src={peerAvatar}
                                  alt=""
                                />
                              ) : (
                                <span className={styles.messageAvatarFallback}>
                                  {peerInitial}
                                </span>
                              )
                            ) : (
                              <span className={styles.messageAvatarSpacer} />
                            ))}

                          <div className={styles.bubbleWrap}>
                            <div className={styles.bubbleLine}>
                              <div
                                className={`${styles.bubble} ${isMine ? styles.bubbleMine : ""} ${m.deletedForEveryone ? styles.bubbleDeleted : ""}`}
                              >
                                {m.deletedForEveryone ? (
                                  <span className={styles.deletedText}>
                                    This message was deleted
                                  </span>
                                ) : (
                                  <>
                                    {m.body}
                                    {m.task && (
                                      <div className={styles.taskPanel}>
                                        <strong>Task</strong>
                                        <p>{m.task.body}</p>
                                        <span className={styles.taskStatus}>
                                          {m.task.status}
                                        </span>
                                        {m.task.status === "open" && (
                                          <div className={styles.taskActions}>
                                            <button
                                              type="button"
                                              className={styles.taskActionBtn}
                                              onClick={() =>
                                                handleUpdateTask(
                                                  m.task!.id,
                                                  "cleared",
                                                )
                                              }
                                            >
                                              Clear
                                            </button>
                                            <button
                                              type="button"
                                              className={styles.taskActionBtn}
                                              onClick={() =>
                                                handleUpdateTask(
                                                  m.task!.id,
                                                  "deleted",
                                                )
                                              }
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {m.hasTask && (
                                      <p className={styles.taskSentHint}>
                                        Task sent (only they can see it)
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              <button
                                type="button"
                                className={styles.msgMenuBtn}
                                onClick={() =>
                                  setMenuMessageId(
                                    menuMessageId === m.id ? null : m.id,
                                  )
                                }
                                aria-label="Message options"
                              >
                                ⋯
                              </button>
                            </div>

                            {menuMessageId === m.id && (
                              <div className={styles.msgActions}>
                                {isMine && !m.deletedForEveryone && (
                                  <button
                                    type="button"
                                    className={styles.msgActionBtn}
                                    onClick={() =>
                                      handleDeleteMessage(m.id, "everyone")
                                    }
                                  >
                                    Delete for everyone
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={styles.msgActionBtn}
                                  onClick={() => handleDeleteMessage(m.id, "me")}
                                >
                                  Delete for me
                                </button>
                                <button
                                  type="button"
                                  className={styles.msgActionDismiss}
                                  onClick={() => setMenuMessageId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {isGroupEnd && (
                              <span className={styles.messageTime}>
                                {formatClockTime(m.createdAt)}
                              </span>
                            )}
                          </div>
                        </li>
                      </Fragment>
                    );
                  })}

                  {peerIsTyping && (
                    <li className={styles.messageRow}>
                      {peerAvatar ? (
                        <img
                          className={styles.messageAvatar}
                          src={peerAvatar}
                          alt=""
                        />
                      ) : (
                        <span className={styles.messageAvatarFallback}>
                          {peerInitial}
                        </span>
                      )}
                      <div className={styles.typingBubble}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </li>
                  )}

                  <li
                    ref={messagesAnchorRef}
                    className={styles.messagesAnchor}
                    aria-hidden="true"
                  />
                </ul>

                <form className={styles.composer} onSubmit={handleSendMessage}>
                  <div className={styles.composerDock}>
                    <label className={styles.attachTaskRow}>
                      <input
                        type="checkbox"
                        checked={attachTask}
                        onChange={(e) => setAttachTask(e.target.checked)}
                      />
                      Add a task for {peerName}
                    </label>

                    {attachTask && (
                      <input
                        type="text"
                        className={styles.taskInput}
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        placeholder={`What should ${peerName} do?`}
                      />
                    )}

                    <div className={styles.composerRow}>
                      <input
                        type="text"
                        className={styles.messageInput}
                        value={messageText}
                        onChange={(e) =>
                          handleMessageTextChange(e.target.value)
                        }
                        onBlur={stopTypingSignal}
                        placeholder={`Message ${peerName}…`}
                        required
                      />
                      <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={sending}
                      >
                        {sending ? "…" : "Send"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </section>

          <aside
            className={`${styles.sidePanel} ${styles.tasksPanel} ${!tasksPanelOpen ? styles.sidePanelCollapsed : ""}`}
          >
            <div className={styles.sidePanelHeader}>
              {tasksPanelOpen && (
                <>
                  <button
                    type="button"
                    className={styles.panelToggleBtn}
                    onClick={() => setTasksPanelOpen(false)}
                    aria-label="Collapse tasks panel"
                  >
                    ›
                  </button>
                  <span className={styles.sidePanelTitle}>
                    My tasks
                    {openTaskCount > 0 && (
                      <span className={styles.sidebarSectionCount}>
                        {openTaskCount}
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>

            {tasksPanelOpen ? (
              <div className={`${styles.sidePanelBody} ${styles.scrollHidden}`}>
                <div className={styles.taskFilterTabs}>
                  {(
                    [
                      ["open", "Open"],
                      ["cleared", "Done"],
                      ["all", "All"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.taskFilterTab} ${taskFilter === value ? styles.taskFilterTabActive : ""}`}
                      onClick={() => setTaskFilter(value)}
                    >
                      {label}
                      {value === "open" && openTaskCount > 0 && (
                        <span className={styles.taskFilterBadge}>
                          {openTaskCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <ul className={styles.taskInboxList}>
                  {displayedTasks.length === 0 ? (
                    <li className={styles.taskInboxEmpty}>
                      {taskFilter === "open"
                        ? "No open tasks"
                        : taskFilter === "cleared"
                          ? "No completed tasks"
                          : "No tasks yet"}
                    </li>
                  ) : (
                    displayedTasks.map((t, index) => {
                      const isUpdating = updatingTaskId === t.id;
                      const isDragging = draggingTaskId === t.id;
                      const isDragOver =
                        dragOverTaskId === t.id && draggingTaskId !== t.id;
                      const canReorder = taskFilter === "open";

                      return (
                        <li
                          key={t.id}
                          className={`${styles.taskCard} ${isDragging ? styles.taskCardDragging : ""} ${isDragOver ? styles.taskCardDragOver : ""} ${t.status === "cleared" ? styles.taskCardDone : ""}`}
                          draggable={canReorder && !isUpdating}
                          onDragStart={() => setDraggingTaskId(t.id)}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverTaskId(null);
                          }}
                          onDragOver={(e) => {
                            if (!canReorder || !draggingTaskId) return;
                            e.preventDefault();
                            setDragOverTaskId(t.id);
                          }}
                          onDragLeave={() => {
                            if (dragOverTaskId === t.id) {
                              setDragOverTaskId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggingTaskId) {
                              reorderTasks(draggingTaskId, t.id);
                            }
                            setDraggingTaskId(null);
                            setDragOverTaskId(null);
                          }}
                        >
                          <div className={styles.taskCardTop}>
                            {canReorder && (
                              <span
                                className={styles.taskDragHandle}
                                title="Drag to reorder"
                                aria-hidden="true"
                              >
                                ⠿
                              </span>
                            )}

                            {t.status === "open" ? (
                              <input
                                type="checkbox"
                                className={styles.taskCompleteCheck}
                                checked={false}
                                disabled={isUpdating}
                                onChange={() =>
                                  handleUpdateTask(t.id, "cleared")
                                }
                                aria-label={`Mark "${t.body}" as done`}
                              />
                            ) : (
                              <span
                                className={styles.taskDoneBadge}
                                title="Completed"
                              >
                                ✓
                              </span>
                            )}

                            <div className={styles.taskCardContent}>
                              <p className={styles.taskInboxBody}>{t.body}</p>
                              <p className={styles.taskInboxMeta}>
                                from {taskSenderLabel(t.message.senderId)} ·{" "}
                                {formatTaskAge(t.createdAt)}
                              </p>
                              {t.message.body && (
                                <p className={styles.taskMessagePreview}>
                                  “{t.message.body.slice(0, 60)}
                                  {t.message.body.length > 60 ? "…" : ""}”
                                </p>
                              )}
                            </div>
                          </div>

                          <div className={styles.taskCardActions}>
                            <button
                              type="button"
                              className={styles.taskCardActionPrimary}
                              disabled={isUpdating}
                              onClick={() => openChatFromTask(t)}
                            >
                              Go to chat
                            </button>

                            {t.status === "open" && (
                              <button
                                type="button"
                                className={styles.taskCardActionBtn}
                                disabled={isUpdating}
                                onClick={() =>
                                  handleUpdateTask(t.id, "cleared")
                                }
                              >
                                Clear
                              </button>
                            )}

                            <button
                              type="button"
                              className={`${styles.taskCardActionBtn} ${styles.taskCardActionDanger}`}
                              disabled={isUpdating}
                              onClick={() =>
                                handleUpdateTask(t.id, "deleted")
                              }
                            >
                              Delete
                            </button>

                            {canReorder && (
                              <div className={styles.taskReorderBtns}>
                                <button
                                  type="button"
                                  className={styles.taskReorderBtn}
                                  disabled={isUpdating || index === 0}
                                  onClick={() => moveTask(t.id, "up")}
                                  aria-label="Move task up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  className={styles.taskReorderBtn}
                                  disabled={
                                    isUpdating ||
                                    index === displayedTasks.length - 1
                                  }
                                  onClick={() => moveTask(t.id, "down")}
                                  aria-label="Move task down"
                                >
                                  ↓
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            ) : (
              <button
                type="button"
                className={styles.sidePanelRail}
                onClick={() => setTasksPanelOpen(true)}
                aria-label="Expand tasks panel"
              >
                <span className={styles.sidePanelRailLabel}>Tasks</span>
                {openTaskCount > 0 && (
                  <span className={styles.sidePanelRailCount}>
                    {openTaskCount}
                  </span>
                )}
              </button>
            )}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authShell}>
        <AuthBrand />
        <div className={styles.authCard}>
          <div className={styles.authCardHeader}>
            <h2 className={styles.authTitle}>
              {authView === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className={styles.authSubtitle}>
              {authView === "login"
                ? "Sign in to continue to PanChat"
                : "Join PanChat — it only takes a minute"}
            </p>
          </div>

        {authView === "login" ? (
          <form className={styles.authForm} onSubmit={handleLogin}>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabelText}>Email</span>
              <input
                className={styles.fieldInput}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabelText}>Password</span>
              <input
                className={styles.fieldInput}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>
            {error && <p className={styles.errorBanner}>{error}</p>}
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form className={styles.authForm} onSubmit={HandleRegister}>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabelText}>Email</span>
              <input
                className={styles.fieldInput}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabelText}>Password</span>
              <input
                className={styles.fieldInput}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </label>
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabelText}>Confirm password</span>
              <input
                className={styles.fieldInput}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Repeat password"
              />
            </label>
            {error && <p className={styles.errorBanner}>{error}</p>}
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        <p className={styles.authSwitch}>
          {authView === "login" ? (
            <>
              No account?{" "}
              <button
                type="button"
                className={styles.authLink}
                onClick={() => {
                  setAuthView("register");
                  setError(null);
                }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className={styles.authLink}
                onClick={() => {
                  setAuthView("login");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
        </div>
      </div>
    </div>
  );
}

export default App;
