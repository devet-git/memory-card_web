import { useState } from "react";
import styled from "styled-components";

const Inner = styled.div``
const FrontFace = styled.div``
const BackFace = styled.div``
type WrapperProps = {
   isClick: boolean
   isMouseLeave: boolean
}
const Wrapper = styled.div<WrapperProps>`
   background-color: transparent;
   padding: 5px;
   width: auto;
   height: 200px;
   max-height: 300px;
   cursor: pointer; 
   perspective: 1000px;
   overflow: hidden;
   ${Inner}{
      width: 100%;
      height: 100%;
      position: relative;
      transition: transform 0.75s;
      transform-style: preserve-3d;
      border-radius: 5px;
      text-align: center;
      vertical-align: middle;
      ${props => props.isClick && `
         transform: rotateY(180deg);
      `}
      ${props => (props.isMouseLeave && props.isClick) && `transform: rotateY(-180deg);`}
   }
   ${FrontFace}, ${BackFace}{
      position: absolute;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      width: 100%;
      height: 100%;
      border-radius: 5px;
      background-color: #dfdfdf;
   }
   
   ${BackFace}{
      background-color: #ff98ea;
      transform: rotateY(180deg)
   }
`
type Props = {
   front: any,
   back: any
}
export default function FlipCard(props: Props) {
   const [isClick, setIsClick] = useState(false)
   const [isMouseLeave, setIsMouseLeave] = useState(false)

   const evenHandler = (even: 'click' | 'mouseLeave') => {
      switch (even) {
         case "click":
            setIsClick(true)
            break;
         case "mouseLeave":
            setIsClick(false)
            setIsMouseLeave(true)
            break;
         default:
            break;
      }
   }
   return (
      <Wrapper
         onClick={() => evenHandler('click')}
         onMouseLeave={() => evenHandler('mouseLeave')}
         isClick={isClick} isMouseLeave={isMouseLeave}
         title="Click to show definition"
      >
         <Inner>
            <FrontFace className="flex flex--center">
               {props.front}
            </FrontFace>
            <BackFace className="flex flex--center">
               {props.back}
            </BackFace>
         </Inner>
      </Wrapper>
   )
}