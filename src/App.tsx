import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { createConfigValueRetriever } from './config-retriever'
import { useConfigValue } from './use-config-value'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App

const fiddle = () => {
  const Config = createConfigValueRetriever(
    {
      KEY_1: {
        value: [''],
      },
      KEY_2: {
        retrieve: async () => 'asdfd',
        value: 123,
      },
      KEY_3: {
        retrieve: async () => 'asdfd',
      },
    },
    {
      dev: {},
    }
  )

  const xxx = Config.get('KEY_2')

  const Component = () => {
    const config = useConfigValue(Config, 'KEY_2')

    return <>{config.value}</>
  }

  console.log(xxx)
}
