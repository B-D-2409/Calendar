import './App.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import Container from './Components/ControlContainer/ControlContainer';
import SideBar from './Components/NavigationBar/NavigationBar';
import HomePage from './Pages/HomePage/HomePage';
import AboutPage from './Pages/AboutPage/AboutPage';
import Calendar from './Components/Calendar/Calendar';
import Authentication from './Components/Authentication/Authentication';
import Admin from './Components/Admin/Admin';
import 'react-toastify/dist/ReactToastify.css';
import MyEventsPage from './Pages/MyEventsPage/MyEventsPage';
import PublicPage from './Pages/PublicPage/PublicPage';
import CreateEvent from './Components/Events/Events';
import EventDetailsPage from './Pages/EventDetailsPage/EventDetailsPage';
import Contacts from "./Pages/Contacts/Contacts";
import ProfileDetailsComponent from './Pages/ProfilePage/ProfilePage';
import { useContext } from 'react';
import { AuthContext, AuthContextType } from './Common/AuthContext';
import EventSeriesForm from './Components/SeriesOfEvents/SeriesOfEvents';
import Authenticated from './Common/AuthenticateUser';
import { ToastContainer } from "react-toastify";
import Notifications from './Pages/Notifications/Notifications';
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
                isLoggedIn ? <Navigate to="/calendar" replace /> : <PublicPage />
              }
            />
            <Route path="/authentication" element={<Authentication />} />
            <Route path="/calendar" element={<Authenticated><Calendar /></Authenticated>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<Authenticated><Contacts /></Authenticated>} />
            <Route path="/profilepage" element={<Authenticated><ProfileDetailsComponent /></Authenticated>} />
            <Route path="/homepage" element={<Authenticated><HomePage /></Authenticated>} />
            <Route path="/admin" element={<Authenticated><Admin /></Authenticated>} />
            <Route path="/events" element={<Authenticated><CreateEvent /></Authenticated>} />
            <Route path="/myeventpage" element={<Authenticated><MyEventsPage /></Authenticated>} />
            <Route path="/eventdetailspage/:id" element={<Authenticated><EventDetailsPage /></Authenticated>} />
            <Route path="/seriesofevents" element={<Authenticated><EventSeriesForm /></Authenticated>} />
            <Route path='/notifications' element={<Authenticated><Notifications /></Authenticated>} />

            <Route path="/publicpage" element={<PublicPage />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </main>
          <ToastContainer    position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"/>
    </div>
  );
}

export default App;
