import { ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
interface MainLayoutProps {
	children: ReactNode
}

const Flex = styled.div`
	display: flex;
	justify-content: space-between;
`
export default function MainLayout({ children }: MainLayoutProps): JSX.Element {
	return (
		<div style={{padding: "0 20px"}}>
			<nav style={{position:"sticky", top:0, padding:"10px 0", background:"white"}}>
				<Flex>
					<h1><Link to="/">MECADEVET</Link></h1>
					<Flex>
						<Link to='collections'>Colections</Link>
					</Flex>
				</Flex>

			</nav>
			<section className="showpage">{children}</section>
		</div>
	)
}