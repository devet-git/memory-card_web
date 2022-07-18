import { useEffect } from "react"
import { useState } from "react"
import styled from "styled-components"
import { CgClose } from "react-icons/cg"
import MyButton from "components/MyButton"


const ContentWrapper = styled.div``
const Header = styled.header``
const Body = styled.div``
type styleProps = {
   isShow: boolean
}
const Container = styled.div<styleProps>`
   position: fixed;
   top: 0;
   bottom: 0;
   left: 0;
   width: 100%;
   background-color: #c0c0c03e;
   backdrop-filter: blur(2px);
   display: flex;
   justify-content: center;
   align-items: center;
   ${props => !props.isShow && `display: none;`}
   ${ContentWrapper}{
      background-color: white;
      border-radius: 3px;
      overflow: hidden;
      box-shadow: 0 2px 10px #a6a6a6;
      min-width: 300px;
      ${Header}{
         padding: 5px;
         background-color: #ececec;
         display: flex;
         justify-content: space-between;
         align-items: center;
      }
      ${Body}{
         padding: 5px;
      }
   }
`
type Props = {
   title?: string
   children: any,
   onClose: any
}
export default function MyModal(props: Props) {
   const [isShow, setIsShow] = useState(true)
   useEffect(() => {
      setIsShow(true)
   }, [])
   return (
      <Container isShow={isShow}>
         <ContentWrapper id="box">
            <Header>
               <h3>{props.title}</h3>
               <MyButton
                  icon={<CgClose />}
                  fontSz={10}
                  color="white"
                  bgColor="red"
                  onClick={(e: any) => {
                     setIsShow(false)
                     props.onClose();
                  }}
               />
            </Header>
            <Body>{props.children}</Body>
         </ContentWrapper>
      </Container>
   )
}
