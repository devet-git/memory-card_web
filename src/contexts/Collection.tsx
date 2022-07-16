import { createContext, useContext, useEffect, useState } from "react";
import mockData from "utils/mockData"

type collectionTypes = {
   collections?: any,
   setCollections?: any
}
const CollectionContext = createContext<collectionTypes>({})

export function CollectionProvider({ children }: any) {
   const initCollection = localStorage.appData ? JSON.parse(localStorage.appData) : mockData
   const [collections, setCollections] = useState(initCollection)

   // useEffect(() => {
   //    if (localStorage.appData) {
   //       const storedData = JSON.parse(localStorage.appData)
   //       setCollections(storedData)
   //    }
   // }, [])

   useEffect(() => {
      localStorage.setItem("appData", JSON.stringify(collections))
   }, [collections])

   let contextValues = {
      collections, setCollections
   }
   return (
      <CollectionContext.Provider value={contextValues}>
         {children}
      </CollectionContext.Provider>
   )
}
const useCollectionContext = () => useContext(CollectionContext)
export default useCollectionContext
