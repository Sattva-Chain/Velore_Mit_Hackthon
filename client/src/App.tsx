

import './App.css'
import {Navigate, Route,Routes} from "react-router-dom"
import DashBord from './pages/DashBord'
import Analysis from './pages/components/Analysis'
import Profile from './pages/components/Profile'
import Seeting from './pages/components/Seeting'
import {Toaster} from "react-hot-toast"
import Home from './pages/Home'
import EmployeeLogin from './components/EmployLogin'
import EmployeeSignup from './components/EmploySignp'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import InviteAcceptPage from './pages/auth/InviteAcceptPage'
import MainDashBoardLayout from './pages/Dashboard/MainDashBoardLayout'
import DashboardHome from './pages/Dashboard/pages/DashboardHome'
import Settings from './pages/Dashboard/pages/Setting'
import Scans from './pages/Dashboard/pages/Scans'
import TeamHub from './pages/Dashboard/pages/TeamHub'
import { userAuth } from './context/Auth'
import EmployedLogs from './pages/Dashboard/pages/EmployedLogs'
import Report from './pages/Dashboard/pages/Report'
import OrganizationVulnerabilities from './pages/Dashboard/pages/OrganizationVulnerabilities'
function App() {

const { company, user, token, sessionHydrated } = userAuth()!
  return (
    <>
<Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // Default options for all toasts
          style: {
            background: "#9CA3AF", // Tailwind gray-400
            color: "#FFFFFF",      // White text
            fontWeight: "500",
            borderRadius: "0.5rem",
          },
        }}
      />
    <Routes>
      <Route
          path="/"
          element={
            !sessionHydrated ? (
              <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
                Loading session…
              </div>
            ) : company || user || token ? (
              <Navigate to="/Dashboard2" replace />
            ) : (
              <LoginPage />
            )
          }
        />
      <Route path='/register' element={<RegisterPage/>}/>
      <Route path='/invite/accept' element={<InviteAcceptPage/>}/>
    
      <Route path='/login' element={<EmployeeLogin/>}/>
      <Route path='/singup' element={<EmployeeSignup/>}/>
      {/* old dashboard */}
      <Route path='/Dashboard' element={<DashBord/>}>
         <Route index  element={<Analysis/>} />
         <Route path='Profile'  element={<Profile/>} />
         <Route path='Setting'  element={<Seeting/>} />
      </Route>
      {/* New DashBoard */}
       <Route path='/Dashboard2' element={<MainDashBoardLayout/>}>
         <Route index  element={<DashboardHome/>} />
         <Route path='settings'  element={<Settings/>} />
         <Route path='scans'  element={<Scans/>} />
         <Route path='reports'  element={<Report/>} />
         <Route path='vulnerabilities'  element={<OrganizationVulnerabilities/>} />
         <Route path='manegEmploy/employedLogs/:id'  element={<EmployedLogs/>} />
         <Route path='manegEmploy'  element={<TeamHub/>} />
         <Route path='team'  element={<TeamHub/>} />
      </Route>
    </Routes>
    </>
  )
}

export default App
