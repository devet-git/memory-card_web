import { Link } from "react-router-dom";

export default function HomePage() {
   return (
      <>
         <h1>HOME PAGE</h1>
         <Link to="collections">Create Collection now</Link>
      </>
   )
}
