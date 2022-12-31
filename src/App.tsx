import { createConfigValueRetriever } from './utils/config-retriever'
import { useConfigValue } from './utils/use-config-value'
import { Config } from './config'
import { Box, Button, CircularProgress, Grid } from '@mui/material'
import { Link, Route, Routes } from 'react-router-dom'
import React, { useMemo } from 'react'

function App() {
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      textAlign="center"
    >
      <Routes>
        <Route path="/page1" element={<Page1 />} />
        <Route path="/page2" element={<Page2 />} />
        <Route path="/page3" element={<Page3 />} />
        <Route path="*" element={<h2>choose page</h2>} />
      </Routes>
      <Links />
      <CurrentTheme />
    </Box>
  )
}

const Links = () => {
  const links = useMemo(() => ['/page1', '/page2', '/page3'], [])

  return (
    <Grid display="flex" justifyContent="center" container spacing="2px">
      {links.map((link) => (
        <Link to={link} key={link}>
          <Button variant="contained">{link}</Button>
        </Link>
      ))}
    </Grid>
  )
}

const CurrentTheme = () => {
  const themeConfig = useConfigValue(Config, 'APP_THEME')

  return (
    <div>
      <h4>Current theme is</h4>
      {themeConfig.isLoading ? (
        <Box>
          <CircularProgress />
        </Box>
      ) : (
        <h3>{themeConfig.value}</h3>
      )}
    </div>
  )
}

const createPage = (number: number) => {
  const Component: React.FC = () => {
    const themeConfig = useConfigValue(Config, 'APP_THEME')
    return (
      <>
        <h2>Page {number}</h2>
        {themeConfig.isLoading ? (
          <Box>
            <CircularProgress />
          </Box>
        ) : (
          <p>{themeConfig.value}</p>
        )}
      </>
    )
  }

  Component.displayName = `Page${number}`

  return Component
}

const Page1 = createPage(1)
const Page2 = createPage(2)
const Page3 = createPage(3)

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
    const config = useConfigValue(Config, 'KEY_1')

    return <>{config.value?.map((x) => x.big())}</>
  }

  console.log(xxx)
}
