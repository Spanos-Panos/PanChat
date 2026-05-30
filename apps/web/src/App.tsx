import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import styles from "./App.module.css";
import { apiFetch , apiUploadAvatar , avatarSrc } from "./lib/api";
import { io, type Socket } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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

type AuthView = "login" | "register";

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
  const activeThreadRef = useRef(activeThread);activeThreadRef.current = activeThread;
  const [openingChat, setOpeningChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileBirthDate, setProfileBirthDate] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [attachTask, setAttachTask] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [inboxTasks, setInboxTasks] = useState<InboxTask[]>([]);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarBust, setAvatarBust] = useState<Record<string, number>>({});

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

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error", err.message);
    });

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
    };
  }, [user?.id]);

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
      setInboxTasks([]);
      return;
    }

    async function loadInbox() {
      try {
        const data = await apiFetch<{ tasks: InboxTask[] }>(
          "/api/v1/tasks/inbox?status=open",
        );
        setInboxTasks(data.tasks);
      } catch {
        setInboxTasks([]);
      }
    }

    loadInbox();
  }, [user, messages]);

  useEffect(() => {
    if (!activeThread) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const data = await apiFetch<MessagesResponse>(
          `/api/v1/threads/${activeThread.id}/messages`,
        );
        setMessages(data.messages);
        setMessagesError(null);
      } catch (err) {
        setMessages([]);
        setMessagesError(
          err instanceof Error ? err.message : "Failed to load messages",
        );
      }
    }

    loadMessages();
  }, [activeThread]);

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
      setInboxTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : "Failed to update task",
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
  }

  if (checkingSession) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.panChatTitle}>PanChat</h1>
          <p className={styles.authSubtitle}>Loading…</p>
        </div>
      </div>
    );
  }

  if (user && !user.profileCompleted) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.panChatTitle}>Set up your profile</h1>
          <p className={styles.authSubtitle}>
            Signed in as {user.email}. Pick a username to join PanChat.
          </p>

          <form className={styles.authForm} onSubmit={handleCompleteProfile}>
            <label>
              Username (required)
              <input
                type="text"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value)}
                required
                minLength={3}
                placeholder="panos"
              />
            </label>
            <label>
              Display name (optional)
              <input
                type="text"
                value={profileDisplayName}
                onChange={(e) => setProfileDisplayName(e.target.value)}
                placeholder="Panos"
              />
            </label>
            <label>
              Birth date (optional)
              <input
                type="date"
                value={profileBirthDate}
                onChange={(e) => setProfileBirthDate(e.target.value)}
              />
            </label>
            {profileError && <p className={styles.errorText}>{profileError}</p>}
            <button
              type="submit"
              className={`${styles.counter} ${styles.authSubmit}`}
              disabled={loading}
            >
              {loading ? "Saving…" : "Continue to PanChat"}
            </button>
          </form>

          <button
            type="button"
            className={styles.authLink}
            onClick={HandleLogout}
            style={{ display: "block", margin: "1rem auto 0" }}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <h1 className={styles.panChatTitle}>PanChat</h1>
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
              <span className={styles.headerMeta}>
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
            className={styles.counter}
            onClick={HandleLogout}
          >
            Log out
          </button>
        </header>

        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>People</h2>
            {usersError && <p className={styles.errorText}>{usersError}</p>}
            <ul className={styles.userList}>
              {users.map((u) => {
                const isActive = activeThread?.peer.id === u.id;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      className={`${styles.userButton} ${isActive ? styles.userButtonActive : ""}`}
                      disabled={openingChat || u.id === user.id}
                      onClick={() => openChat(u.id)}
                    >
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
                      {u.displayName ?? u.username}
                    </button>
                  </li>
                );
              })}
            </ul>

            <h2 className={styles.sidebarTitle}>My tasks</h2>
            <ul className={styles.taskInboxList}>
              {inboxTasks.length === 0 ? (
                <li className={styles.taskInboxEmpty}>No open tasks</li>
              ) : (
                inboxTasks.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={styles.taskInboxButton}
                      onClick={() => openChatFromTask(t)}
                    >
                      <span className={styles.taskInboxBody}>{t.body}</span>
                      <span className={styles.taskInboxMeta}>
                        from: “{t.message.body.slice(0, 40)}
                        {t.message.body.length > 40 ? "…" : ""}”
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>

          <section className={styles.chatPanel}>
            {!activeThread ? (
              <div className={styles.chatEmpty}>
                Select someone to start chatting
              </div>
            ) : (
              <>
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
                  <h2 className={styles.chatHeader}>
                    {activeThread.peer.displayName ??
                      activeThread.peer.username}
                  </h2>
                </div>

                {messagesError && (
                  <p className={styles.errorText}>{messagesError}</p>
                )}

                <ul className={styles.messages}>
                  {messages.map((m) => {
                    const isMine = m.senderId === user.id;
                    return (
                      <li
                        key={m.id}
                        className={`${styles.messageItem} ${isMine ? styles.messageMine : ""}`}
                      >
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
                                    handleUpdateTask(m.task!.id, "cleared")
                                  }
                                >
                                  Clear
                                </button>
                                <button
                                  type="button"
                                  className={styles.taskActionBtn}
                                  onClick={() =>
                                    handleUpdateTask(m.task!.id, "deleted")
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
                      </li>
                    );
                  })}
                </ul>

                <form className={styles.composer} onSubmit={handleSendMessage}>
                  <label className={styles.attachTaskRow}>
                    <input
                      type="checkbox"
                      checked={attachTask}
                      onChange={(e) => setAttachTask(e.target.checked)}
                    />
                    Attach a task for{" "}
                    {activeThread.peer.displayName ??
                      activeThread.peer.username}
                  </label>

                  {attachTask && (
                    <input
                      type="text"
                      className={styles.taskInput}
                      value={taskText}
                      onChange={(e) => setTaskText(e.target.value)}
                      placeholder="What should they do?"
                    />
                  )}

                  <div className={styles.composerRow}>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      required
                    />
                    <button
                      type="submit"
                      className={styles.counter}
                      disabled={sending}
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.panChatTitle}>PanChat</h1>
        <p className={styles.authSubtitle}>
          {authView === "login" ? "Sign in to continue" : "Create your account"}
        </p>

        {authView === "login" ? (
          <form className={styles.authForm} onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className={styles.errorText}>{error}</p>}
            <button
              type="submit"
              className={`${styles.counter} ${styles.authSubmit}`}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form className={styles.authForm} onSubmit={HandleRegister}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            {error && <p className={styles.errorText}>{error}</p>}
            <button
              type="submit"
              className={`${styles.counter} ${styles.authSubmit}`}
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
  );
}

export default App;
