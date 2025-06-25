import './App.css'
import { Route, Routes } from 'react-router-dom'
import Container from './Components/ControlContainer/ControlContainer'
import Profile from './Components/ProfileInfo/ProfileInfo'
import SideBar from './Components/SideBar/SideBar'
import HomePage from './Pages/HomePage/HomePage'
import AboutPage from './Pages/AboutPage/AboutPage'
import ContactListForm from './Components/Contacts/ContactListForm'
function App() {




  return (
    <div className="App">
      <SideBar />
      <main className="main-content">
        <Container>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactListForm />} />
          <Route path='/ProfileInfo' element={<Profile />} />
        </Routes>
        </Container>
      </main>
    </div>
  )
}

export default App
