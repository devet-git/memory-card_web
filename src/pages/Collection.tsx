import Collection from "components/Collection"
import MyButton from "components/MyButton"
import { useState } from "react"
import styled from "styled-components"
import { RiAddFill } from "react-icons/ri"
import { MyInput } from "components/MyInput"
import { removeAccent } from "utils/removeAccent"
import useCollectionContext from "contexts/Collection"



const useSharedState = () => {
   const [isAddCollection, setIsAddCollection] = useState(false)
   const [newCollectionName, setNewCollectionName] = useState("")
   return {
      isAddCollection, setIsAddCollection,
      newCollectionName, setNewCollectionName
   }
}


const AddCollectionWrapper = styled.div`
   background-color: #6d848b;
   padding: 7px 20px;
   border-radius: 2px;
   position: sticky;
`
function AddCollection() {
   const {
      isAddCollection, setIsAddCollection,
      newCollectionName, setNewCollectionName
   } = useSharedState()
   const { collections, setCollections } = useCollectionContext()

   const [inputPlaceholder, setInputPlaceholder] = useState("Tên bộ sưu tập. /Enter: Xác nhận. /Esc: Thoát")
   const keyPressHandler = (e: any) => {
      if (e.key === "Enter") {
         const isExist = collections.find((coll: { name: string }) => coll.name === newCollectionName)

         if (newCollectionName) {
            if (isExist) {
               setInputPlaceholder("Đã có bộ sưu tập này rồi")
               setNewCollectionName("")
            } else {
               let clearStr = newCollectionName.trim()
               const pathname = removeAccent(clearStr)
               const newCollection = { name: clearStr, pathname, words: [] }
               setCollections([newCollection, ...collections])
               e.target.select()
               setInputPlaceholder("Tên bộ sưu tập")
            }
         } else {
            setInputPlaceholder("Bạn chưa nhập gì cả 😢")
         }
      }
      e.key === "Escape" && setIsAddCollection(false)
   }
   return (
      <AddCollectionWrapper>
         {!isAddCollection && (
            <MyButton
               onClick={() => setIsAddCollection(!isAddCollection)}
               icon={<RiAddFill />}
            >
               Thêm danh mục
            </MyButton>
         )}

         {isAddCollection && (
            <MyInput type="text" autoFocus
               placeholder={inputPlaceholder}
               value={newCollectionName}
               onChange={(e) => setNewCollectionName(e.target.value)}
               onKeyDown={keyPressHandler}
            />
         )}
      </AddCollectionWrapper>
   )
}



const PageContainer = styled.main`
   padding: 10px 20px;
`
export default function CollectionPage() {
   const { collections } = useCollectionContext()
   return (
      <PageContainer>
         <AddCollection />
         {collections.map((collection: { pathname: string; name: string }, index: any) =>
            <Collection key={index} href={collection.pathname} name={collection.name} />
         )}
      </PageContainer>
   )
}
