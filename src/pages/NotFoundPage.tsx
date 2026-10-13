import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <main className="not-found-page">
    <p className="not-found-kicker">ERROR / 404</p>
    <h1>This page went off the map.</h1>
    <p>The address may be outdated, or the page may have moved.</p>
    <Link to="/">Return to portfolio ↗</Link>
  </main>
);

export default NotFoundPage;
