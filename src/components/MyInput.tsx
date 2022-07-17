import styled from "styled-components";
type props = {
   bgColor?: string
}
export const MyInput = styled.input<props>`
   font-size: 16px;
   font-weight: bold;
   font-family: inherit;
   padding: 5px;
   width: 100%;
   border: none;
   ${props => props.bgColor && `background-color:${props.bgColor}`}
`
