import { useEffect, useState } from "react";

export function useDevice() {
   const [deviceType, setDeviceType] = useState("laptop")
   useEffect(() => {
      const handler = () => {
         if (window.innerWidth > 768) setDeviceType("laptop")
         if (window.innerWidth <= 768 && window.innerWidth > 500) setDeviceType("tablet")
         if (window.innerWidth <= 500) setDeviceType("mobile")
      }
      window.addEventListener("resize", handler)
      return () => window.removeEventListener("resize", handler)
   }, [])
   return { deviceType }
}