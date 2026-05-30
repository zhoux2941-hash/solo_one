import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "@/pages/Home"
import Convert from "@/pages/Convert"
import Artifact from "@/pages/Artifact"
import Navigation from "@/components/Navigation"
import FavoritesPanel from "@/components/FavoritesPanel"
import { useFavorites } from "@/hooks/useFavorites"

export default function App() {
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const { favorites } = useFavorites()

  return (
    <Router>
      <div className="min-h-screen bg-ink text-parchment">
        <Navigation
          onToggleFavorites={() => setFavoritesOpen(true)}
          favoritesCount={favorites.length}
        />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/convert" element={<Convert />} />
            <Route path="/artifact" element={<Artifact />} />
          </Routes>
        </main>
        <FavoritesPanel
          isOpen={favoritesOpen}
          onClose={() => setFavoritesOpen(false)}
        />
      </div>
    </Router>
  )
}
