import React from 'react';
import { CollectionProvider } from 'contexts/Collection';
import AppRoutes from 'Routes';
import DialogHost from 'components/DialogHost';


function App() {
	return (
		<CollectionProvider>
			<AppRoutes />
			<DialogHost />
		</CollectionProvider>
	);
}

export default App;
