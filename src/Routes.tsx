import React, { Suspense, lazy, useEffect } from "react";
import MainLayout from "layouts/Main";
import { PageLoader } from "components/Loader";
import { Route, Routes } from "react-router-dom";

// Each page is its own chunk, so the first load only downloads what the opened page needs.
const loaders = {
	home: () => import("pages/Home"),
	collections: () => import("pages/Collection"),
	words: () => import("pages/Word"),
	apps: () => import("pages/Ecosystem"),
	review: () => import("pages/Review"),
	stats: () => import("pages/Stats"),
	share: () => import("pages/Share"),
	games: () => import("pages/Games"),
	grammar: () => import("pages/Grammar")
};

const HomePage = lazy(loaders.home);
const CollectionPage = lazy(loaders.collections);
const WordPage = lazy(loaders.words);
const EcosystemPage = lazy(loaders.apps);
const ReviewPage = lazy(loaders.review);
const StatsPage = lazy(loaders.stats);
const SharePage = lazy(loaders.share);
const GamesPage = lazy(loaders.games);
const GrammarPage = lazy(loaders.grammar);

export default function AppRoutes() {
	// Once the browser is idle, fetch the remaining pages so later navigation feels instant
	useEffect(() => {
		const warm = () => Object.values(loaders).forEach((load) => load().catch(() => {}));
		const w = window as any;
		if (typeof w.requestIdleCallback === "function") {
			const id = w.requestIdleCallback(warm, { timeout: 4000 });
			return () => w.cancelIdleCallback?.(id);
		}
		const t = setTimeout(warm, 2500);
		return () => clearTimeout(t);
	}, []);

	return (
		<MainLayout>
			<Suspense fallback={<PageLoader />}>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="collections" element={<CollectionPage />} />
					<Route path="collections/:collectionName" element={<WordPage />} />
					<Route path="review" element={<ReviewPage />} />
					<Route path="stats" element={<StatsPage />} />
					<Route path="games" element={<GamesPage />} />
					<Route path="grammar" element={<GrammarPage />} />
					<Route path="grammar/:topicId" element={<GrammarPage />} />
					<Route path="share" element={<SharePage />} />
					<Route path="apps" element={<EcosystemPage />} />
				</Routes>
			</Suspense>
		</MainLayout>
	)
}
