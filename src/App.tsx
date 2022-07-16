import React from 'react';
import AppRoutes from 'Routes';
import FlipCard from './components/FlipCard/FlipCard';

const engWords = [
	{ eng: "Hello", vi: "Xin chào" },
	{ eng: "Beautiful", vi: "Đẹp" },
	{ eng: "Lemon", vi: "Quả chanh" },
	{ eng: "Dog", vi: "Con chó" },
]
function App() {
	return (
		<AppRoutes />
	);
}

export default App;
