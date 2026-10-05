import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import GamePage from './pages/GamePage.tsx'
import ResultsPage from './pages/ResultsPage.tsx'

// One route per screen. Game state lives in GameProvider (see main.tsx) so it survives navigation.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/play" element={<GamePage />} />
      <Route path="/results" element={<ResultsPage />} />
    </Routes>
  )
}
