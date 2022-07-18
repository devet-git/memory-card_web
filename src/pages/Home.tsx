import { Link } from "react-router-dom";

export default function HomePage() {
	return (
		<div style={{
			height:"90vh",
			display:"flex",
			flexDirection:"column",
			justifyContent:"center", 
			alignItems: "center",
			gap:"10px"
		}}>
			<h1>WELCOME TO MEMORY CARD</h1>
			<Link 
				to={"/collections"}
		 		style={{
					background:"#0096FF",
					padding:"10px 20px",
					borderRadius:"7px",
					fontWeight:"bold",
					color:"white"
			}}>Start now</Link>
		</div>
	)
}
