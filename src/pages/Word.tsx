
import { useParams } from "react-router-dom"
import useCollectionContext from "contexts/Collection"
export default function WordPage() {
   let { collectionName } = useParams()
   let { collections: appData } = useCollectionContext()
   let collection = appData.filter((elem: { pathname: string }) => elem.pathname === collectionName)

   return (
      <>
         {
            collection[0].words && collection[0].words.map((word: { source: string, target: string }, index: any) => (
               <p key={index}>{word.source}: {word.target}</p>
            ))
         }
      </>
   )
}
