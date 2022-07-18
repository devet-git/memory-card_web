import MainLayout from "layouts/Main";
import CollectionPage from "pages/Collection";
import HomePage from "pages/Home";
import WordPage from "pages/Word";
import { Route, Routes } from "react-router-dom";

export default function AppRoutes() {
	return (
		<MainLayout>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="collections" element={<CollectionPage />} />
				<Route path="collections/:collectionName" element={<WordPage />} />
			</Routes>
		</MainLayout>
	)
}