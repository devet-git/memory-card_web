import React from 'react';
import { CollectionProvider } from 'contexts/Collection';
import AppRoutes from 'Routes';


function App() {
	return (
		<CollectionProvider>
			<AppRoutes />
		</CollectionProvider>
	);
}

export default App;
