import { Link, useParams } from "react-router-dom"
import useCollectionContext from "contexts/Collection"
import FlipCard from "components/FlipCard"
import styled from "styled-components"
import { MyInput } from "components/MyInput"
import MyButton from "components/MyButton"
import { useEffect, useRef, useState } from "react"
import { MdCalendarViewMonth, MdCalendarViewDay } from "react-icons/md"
import { useDevice } from "hooks/useDevice"


const Table = styled.table` 
   width: 100%;
   text-align: left;
   
   th{
      background-color: #d8d8d8;
      padding: 20px 10px;
   }
   td{
      padding: 10px;
   }
   tr:nth-child(even){
      background-color: #abcdff;
   }
   tr:nth-child(odd){
      background-color: #c6e7ff;
   }
`
const Grid = styled.div``
const AddWordWrapper = styled.div``
type props = {
   device: string
}
const PageContainer = styled.main<props>`
   padding: 10px;
   ${AddWordWrapper}{
      background-color: #6d848b;
      padding: 7px 10px;
      display: flex;
      gap: 3px;
   }
   ${Grid}{
      display: grid;
      gap: 10px;
      ${props => props.device === "laptop" && "grid-template-columns: auto auto auto;"}
      ${props => props.device === "mobile" && "grid-template-columns: auto;"}
      ${props => props.device === "tablet" && "grid-template-columns: auto auto;"}
   }
`
export default function WordPage() {
   const { collectionName } = useParams()
   const { collections, setCollections } = useCollectionContext()
   const [viewMode, setViewMode] = useState("table")
   const [sourceValue, setSourceValue] = useState("")
   const [targetValue, setTargetValue] = useState("")

   const sourceRef = useRef<HTMLInputElement>(null)
   const targetRef = useRef<HTMLInputElement>(null)
   let selectedcollection = collections.filter((elem: { pathname: string }) => elem.pathname === collectionName)
   let wordsInCollection = selectedcollection[0].words
   const { deviceType } = useDevice()

   const addWordHandler = () => {
      if (sourceValue && targetValue) {
         const index = collections.findIndex((coll: { pathname: string }) => coll.pathname === collectionName)
         const newData = [...collections]
         newData[index].words.unshift({
            id: new Date().getTime(),
            source: sourceValue,
            target: targetValue
         })
         setCollections(newData)
         setSourceValue("")
         setTargetValue("")
         sourceRef.current!.focus()
      }
   }

   return (
      <PageContainer device={deviceType} >
         <div>
            <div>
               <Link to="/collections">Bộ sưu tập</Link>
            </div>
            <AddWordWrapper>
               <MyInput
                  ref={sourceRef}
                  value={sourceValue}
                  onChange={(e) => setSourceValue(e.target.value)}
                  onKeyUp={(e) => (sourceValue && e.key === "Enter") && targetRef.current?.focus()}
                  placeholder="Thông tin"
               />
               <MyInput
                  ref={targetRef}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && addWordHandler()}
                  placeholder="Định nghĩa"
               />
               <MyButton onClick={addWordHandler}>Thêm</MyButton>
            </AddWordWrapper>
            <MyButton
               icon={viewMode === "card" ? <MdCalendarViewMonth /> : <MdCalendarViewDay />}
               onClick={() => setViewMode(viewMode => viewMode === "table" ? "card" : "table")}
            >
               Đổi sang dạng {viewMode === "card" ? "bảng" : "thẻ"}
            </MyButton>
         </div>
         {viewMode === "card" &&
            <Grid>
               {wordsInCollection.map((word: { source: string, target: string }, index: any) => (
                  <FlipCard key={index} front={word.source} back={word.target} />
               ))}
            </Grid>
         }
         {viewMode === "table" && (
            <div style={{ height: "75vh", overflowY: "auto" }}>

               <Table>
                  <thead>
                     <tr>
                        <th>Thông tin</th>
                        <th>Định nghĩa</th>
                     </tr>
                  </thead>
                  <tbody>
                     {wordsInCollection.map((word: { source: string, target: string }, index: any) => (
                        <tr key={index}>
                           <td>{word.source}</td>
                           <td>{word.target}</td>
                        </tr>
                     ))}
                  </tbody>
               </Table>
            </div>

         )}
      </PageContainer >
   )
}
