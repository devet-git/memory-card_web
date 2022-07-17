import styled from "styled-components"
type styleProps = {
   bgColor?: string
   color?: string
   fontSz?: number
}
const Button = styled.button<styleProps>`
   background-color: ${props => props.bgColor ? props.bgColor : "#e8e8e8"};
   color: ${props => props.color ? props.color : "black"};
   border: none;
   border-radius: 2px;
   display: flex;
   align-items: center;
   padding: 3px 8px;
   gap: 7px;
   justify-content: center;
   cursor: pointer;
   font-size: ${props => props.fontSz ? props.fontSz + "px" : `15px`};
   font-weight: bold;
   svg{
      font-size: ${props => props.fontSz ? props.fontSz + 5 + 'px' : `22px`};
      color: ${props => props.color ? props.color : "black"};
   }
`
type props = {
   children?: any
   icon?: any
   onClick?: (arg: any) => any
   color?: string
   bgColor?: string
   fontSz?: number
   className?: string
   title?: string
}
export default function MyButton(props: props) {
   return (
      <Button
         bgColor={props.bgColor}
         fontSz={props.fontSz}
         color={props.color}
         onClick={props.onClick}
         className={props.className}
         title={props.title}
      >
         {props.icon}{props.children}
      </Button>
   )
}
