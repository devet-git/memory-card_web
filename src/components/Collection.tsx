import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import styled from "styled-components"
import MyButton from "./MyButton"
import { MyInput } from "./MyInput"
import { AiOutlineEdit, AiOutlineDelete, AiOutlineCheck, AiOutlineCloseCircle } from "react-icons/ai"
import useCollectionContext from "contexts/Collection"
import { removeAccent } from "utils/removeAccent"



const ToolBox = styled.div``
const CollectionName = styled.span``
const ModifyWrapper = styled.div``
const Wrapper = styled.div`
   position: relative;
   background-color: #e3e3e3;
   padding: 5px 10px;
   margin: 2px 0;
   border-radius: 2px;
   transition: background-color 0.25s;
   display: flex;
   gap: 10px;
   &:hover{
      background-color: #c3e2ff;
   }
   ${CollectionName}{
      padding: 10px;
      display: block;
      flex:0 0 70%;
      /* background-color: red; */
      a:hover{
         font-weight: bold
      }
   }
   ${ToolBox}{
      display: flex;
      justify-content: flex-end;
      gap: 2px;
      flex:0 0 30%;
      opacity: 0.3;
      :hover {
         opacity: 1;
      }
   }
   ${ModifyWrapper}{
      display: flex;
      flex: 0 0 70%;
   }
`

type Props = {
   name: string
   href: string
}
export default function Collection(props: Props) {
   const [isModify, setIsModify] = useState(false)
   const [modifyValue, setModifyValue] = useState(props.name)

   const { collections, setCollections } = useCollectionContext()
   useEffect(() => {
      setModifyValue(props.name)
   }, [props.name])

   const nameModifyHandler = () => {
      if (modifyValue !== props.name) {
         setIsModify(false)
         const cardSelected = [...collections]
         for (let i = 0; i < cardSelected.length; i++) {
            if (cardSelected[i].name === props.name) {
               cardSelected[i].name = modifyValue
               const pathname = removeAccent(modifyValue)
               cardSelected[i].pathname = pathname
               break;
            }
         }
         setCollections(cardSelected)
      }
   }
   const deleteCollectionHandler = () => {
      const cardSelected = collections.filter((coll: { name: string }) => coll.name !== modifyValue)
      setCollections(cardSelected)
   }
   return (
      <Wrapper>
         {isModify ?
            (
               <ModifyWrapper>
                  <MyInput
                     bgColor="#ffffffab"
                     value={modifyValue}
                     onChange={e => { setModifyValue(e.target.value) }}
                     onKeyUp={(e) => {
                        if (e.key === "Enter") {
                           setIsModify(false)
                           nameModifyHandler()
                        }
                     }}
                     onFocus={e => e.target.select()}
                     autoFocus
                  />
               </ModifyWrapper>
            ) :
            (
               <CollectionName>
                  <Link to={props.href} className="dp--block" title="Xem từ trong bộ sưu tập">
                     {props.name}
                  </Link>
               </CollectionName>
            )
         }
         <ToolBox>
            {isModify ? (
               <>
                  <MyButton
                     bgColor="transparent"
                     icon={<AiOutlineCheck />}
                     onClick={nameModifyHandler}
                  />
                  <MyButton
                     bgColor="transparent"
                     icon={<AiOutlineCloseCircle />}
                     onClick={() => setIsModify(false)}
                  />
               </>
            ) : (
               <>
                  <MyButton
                     bgColor="transparent"
                     icon={<AiOutlineEdit />}
                     onClick={() => setIsModify(true)}
                     title="Sửa tên"
                  />
                  <MyButton
                     bgColor="transparent"
                     icon={<AiOutlineDelete />}
                     title="Xóa bộ sưu tập này"
                     onClick={deleteCollectionHandler}
                  />
               </>
            )
            }
         </ToolBox>
      </Wrapper >
   )
}
