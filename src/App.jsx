import { BrowserRouter, Routes, Route } from 'react-router'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Post from './pages/Post'
import About from './pages/About'
import Links from './pages/Links'
import Admin from './components/Admin'
import Editor from './components/Editor'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-[100dvh] flex-col">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slug" element={<Post />} />
            <Route path="/about" element={<About />} />
            <Route path="/links" element={<Links />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/new" element={<Editor />} />
            <Route path="/admin/edit/:slug" element={<Editor />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
