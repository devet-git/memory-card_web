import MainLayout from "layouts/Main";
import CollectionPage from "pages/Collection";
import HomePage from "pages/Home";
import WordPage from "pages/Word";
import EcosystemPage from "pages/Ecosystem";
import ReviewPage from "pages/Review";
import StatsPage from "pages/Stats";
import SharePage from "pages/Share";
import { Route, Routes } from "react-router-dom";

export default function AppRoutes() {
	return (
		<MainLayout>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="collections" element={<CollectionPage />} />
				<Route path="collections/:collectionName" element={<WordPage />} />
				<Route path="review" element={<ReviewPage />} />
				<Route path="stats" element={<StatsPage />} />
				<Route path="share" element={<SharePage />} />
				<Route path="apps" element={<EcosystemPage />} />
			</Routes>
		</MainLayout>
	)
}