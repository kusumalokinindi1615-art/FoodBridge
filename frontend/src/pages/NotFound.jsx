import React from 'react';
import { Link } from 'react-router-dom';
import { Button, PageContainer } from '../components/PublicUI';

export const NotFound = () => (
  <PageContainer className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-24 h-24 bg-gradient-to-br from-teal/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <i className="fas fa-magnifying-glass text-4xl text-teal"></i>
    </div>
    <h1 className="text-6xl font-extrabold text-gray-200 mb-2">404</h1>
    <h2 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h2>
    <p className="text-gray-500 text-sm max-w-sm mb-8">The page you are looking for doesn't exist or may have been moved.</p>
    <Link to="/">
      <Button variant="primary">Return Home</Button>
    </Link>
  </PageContainer>
);
