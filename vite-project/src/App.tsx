import './App.css'
import { Route, Routes } from 'react-router-dom'
import Container from './Components/ControlContainer/ControlContainer'
import Profile from './Components/ProfileInfo/ProfileInfo'
import SideBar from './Components/NavigationBar/NavigationBar'
import HomePage from './Pages/HomePage/HomePage'
import AboutPage from './Pages/AboutPage/AboutPage'
import ContactListForm from './Components/Contacts/ContactListForm'
import Calendar from './Components/Calendar/Calendar'
function App() {




  return (
    <div className="App">
      <SideBar />
      <main className="main-content">
        <Container>
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactListForm />} />
          <Route path='/ProfileInfo' element={<Profile />} />
          <Route path='/homepage' element={<HomePage />} />
        </Routes>
        </Container>
      </main>
    </div>
  )
}

export default App
