import styles from './App.module.css'

function App() {

  return (
    <>
      <main>
        <h1 className={styles.panChatTitle}>PanChat</h1>
        <p>CSS Module is working.</p>
        <button type="button" className={styles.counter}>
          Test button
        </button>
      </main>
    </>
  )
}

export default App