import {useState , useEffect} from 'react'
import type { FormEvent } from 'react'
import styles from './App.module.css'
import { apiFetch } from './lib/api'

type AuthUser = {
  id: string
  email: string
  username?: string | null
  displayName?: string | null
  profileCompleted: boolean
}

type MeResponse={
  user: AuthUser
}

type LoginResponse = {
  user: AuthUser
}

type PublicUser = {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

type UserResponse = {
  users: PublicUser[]
}

type ThreadResponse = {
  thread:{
    id: string
    peer: PublicUser
  }
}

type ChatMessage = {
  id: string
  threadId: string
  senderId: string
  body: string
  createdAt: string
}

type MessagesResponse = {
  messages: ChatMessage[]
}

function App() {
  const [email , setEmail] = useState('')
  const [password , setPassword] = useState('')
  const [error , setError] = useState<string | null>(null)
  const [user , setUser] = useState<AuthUser | null>(null)
  const [loading , setLoading] = useState(false)
  const [checkingSession , setCheckingSession] = useState(true)
  const [users , setUsers] = useState<PublicUser[]>([])
  const [usersError , setUsersError] = useState<string | null>(null)
  const [activeThread, setActiveThread] = useState<ThreadResponse['thread'] | null>(null)
  const [openingChat , setOpeningChat] = useState(false)
  const [messages , setMessages] = useState<ChatMessage[]>([])
  const [messageText , setMessageText] = useState('')
  const [messagesError , setMessagesError] = useState<string | null>(null)
  const [sending , setSending] = useState(false)


  useEffect(() => {
    async function loadMe() {
      try {
        const data = await apiFetch<MeResponse>('/api/v1/auth/me')
        setUser(data.user)
      } catch {
        setUser(null)
      } finally {
        setCheckingSession(false)
      }
    }

    loadMe()
  }, [])

  useEffect(() => {
    if(!user) {
      setUsers([])
      return
    }

    async function loadUsers(){
      try{
        const data = await apiFetch<UserResponse>('/api/v1/users')
        setUsers(data.users)
        setUsersError(null)
      } catch (err) {
        setUsers([])
        setUsersError(err instanceof Error ? err.message : 'Failed to load users')
      }
    }

    loadUsers()
  }, [user])

  useEffect(() => {
    if(!activeThread){
      setMessages([])
      return
    }

    async function loadMessages(){
      try{
        const data = await apiFetch<MessagesResponse>(
          `/api/v1/threads/${activeThread.id}/messages`
        )
        setMessages(data.messages)
        setMessagesError(null)
      } catch(err){
        setMessages([])
        setMessagesError(err instanceof Error? err.message : 'Failed to load messages')
      }
    }

    loadMessages()
  }, [activeThread])

 async function handleSendMessage(e: FormEvent){
  e.preventDefault()
  if(!activeThread) return

  const text = messageText.trim()
  if(!text) return

  setSending(true)
  setMessagesError(null)

  try{
    const data = await apiFetch<{message: ChatMessage}>(
      `/api/v1/threads/${activeThread.id}/messages`,
      {
        method: 'POST',
        body: {body: text},
      }
    )
    setMessages((prev) => [...prev, data.message])
    setMessageText('')
  } catch (err) {
    setMessagesError(err instanceof Error ? err.message : 'Failed to send message')
  } finally {
    setSending(false)
  }
 }

  async function openChat(peerUserId: string){
    setOpeningChat(true)
    setUsersError(null)

    try{
      const data = await apiFetch<ThreadResponse>('/api/v1/threads', {
        method: 'POST',
        body: {peerUserId},
      })

      setActiveThread(data.thread)
    } catch (err) {
      setUsersError(err instanceof Error? err.message: 'Failed to open chat')
    } finally {
      setOpeningChat(false)
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try{
      const data = await apiFetch<LoginResponse>('/api/v1/auth/login',{
        method: 'POST',
        body: {email , password},
      })
      setUser(data.user)
    }catch(err){
      setUser(null)
      setError(err instanceof Error ? err.message: 'Login failed')
    } finally{
      setLoading(false)
    }
  }

  async function HandleLogout() {
    try{
      await apiFetch('/api/v1/auth/logout', {method: 'POST'})
    } catch (err){
      //cookie may be already be gone
    }

    setUser(null)
    setActiveThread(null)
    setMessages([])
    setMessageText('')
    setUsers([])
    setError(null)
    setUsersError(null)
    setMessagesError(null)
  }

  if(checkingSession){
    return(
      <main>
        <h1 className={styles.panChatTitle}>PanChat</h1>
        <p>Loading...</p>
      </main>
    )
  }

  if(user){
    return(
      <main>
        <h1 className={styles.panChatTitle}>PanChat</h1>
        <p>Logged in as {user.email}</p>
        <button type="button" onClick={HandleLogout}>
          Logout
        </button>
        
        <h2>People</h2>
        {usersError &&<p>{usersError}</p>}
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={openingChat || u.id === user.id}
                onClick={() => openChat(u.id)}
              >
                {u.displayName ?? u.username} (@{u.username})
              </button>
            </li>
          ))}
        </ul> 
        
        {activeThread && (
          <section>
            <h2>Chat with {activeThread.peer.displayName ?? activeThread.peer.username}</h2>

            {messagesError && <p>{messagesError}</p>}

            <ul>
              {messages.map((m) => (
                <li key={m.id}>
                  <strong>{m.senderId === user.id ? 'You' : activeThread.peer.username}:</strong>{' '}
                  {m.body}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                required
              />
              <button type="submit" disabled={sending}>
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </section>
        )}
      </main>
    )
  }

  return(
    <main>
      <h1 className={styles.panChatTitle}>PanChat</h1>
      <form onSubmit={handleLogin}>
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
        {error && <p>{error}</p>}
        <button type="submit" className={styles.counter} disabled={loading}>
          {loading ? 'Signing in...' : "Sign in"}
        </button>
      </form>
    </main>
  )
}

export default App