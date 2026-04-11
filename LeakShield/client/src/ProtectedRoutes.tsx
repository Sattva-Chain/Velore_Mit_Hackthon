import { Navigate } from "react-router-dom";
import { userAuth } from "./context/Auth";
import React from 'react'
interface ProtectedRoutesProps {
  children: React.ReactNode;
}
const  ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({children}) =>{
    const {company } = userAuth()!
    if(company){
        return <>{children}</>
    }
  return (
    <Navigate to="/" replace/>
  )
}

export default ProtectedRoutes