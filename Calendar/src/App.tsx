import './App.css'
import { Route, Routes } from 'react-router-dom'
import Container from './Components/ControlContainer/ControlContainer'
import Profile from './Components/ProfileInfo/ProfileInfo'
import SideBar from './Components/NavigationBar/NavigationBar'
import HomePage from './Pages/HomePage/HomePage'
import AboutPage from './Pages/AboutPage/AboutPage'
import Calendar from './Components/Calendar/Calendar'
import Authentication from './Components/Authentication/Authentication';
import Admin from './Components/Admin/Admin';
import 'react-toastify/dist/ReactToastify.css';
import MyEventsPage from './Pages/MyEventsPage/MyEventsPage'
import PublicPage from './Pages/PublicPage/PublicPage'
import CreateEvent from './Components/Events/Events'
import ProtectedRoute from './Components/ProtectedRoutes/ProtectedRoutes'
import PublicOnlyRoute from './Components/Public/PublicRoutes'
import EventDetailsPage from './Pages/EventDetailsPage/EventDetailsPage'
import Contacts from "./Pages/Contacts/Contacts";
import ProfileDetailsComponent from './Pages/ProfilePage/ProfilePage'
import { useContext } from 'react'
import { AuthContext, AuthContextType } from './Common/AuthContext'


function App() {

  const { isLoggedIn } = useContext(AuthContext) as AuthContextType;
  return (
    <div className="App">
      <SideBar />
      <main className="main-content">
        <Container>
          <Routes>
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                ) : (
                  <PublicOnlyRoute>
                    <PublicPage />
                  </PublicOnlyRoute>
                )
              }
            />
            <Route path="/about" element={<AboutPage />} />

            <Route
              path="/contact"
              element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profilepage"
              element={
                <ProtectedRoute>
                  <ProfileDetailsComponent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/homepage"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route path="/authentication" element={<Authentication />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route path="/events"

              element={<ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>}

            >
            </Route>

            <Route
              path="/myeventpage"
              element={
                <ProtectedRoute>
                  <MyEventsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <PublicPage />
                </PublicOnlyRoute>
              }
            />

            <Route path="/eventdetailspage/:id"
              element={
                <ProtectedRoute>
                  <EventDetailsPage />
                </ProtectedRoute>
              }
            >

            </Route>
          </Routes>
        </Container>
      </main>
    </div>
  );
}


export default App
