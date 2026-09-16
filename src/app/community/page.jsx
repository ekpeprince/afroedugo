import React, { Suspense } from 'react';
import CommunityClient from './CommunityClient';

export const metadata = {
  title: 'African Student Community & Network | AfroEduGo',
  description: 'Connect with other African students abroad. Join discussions, find mentors, and build your international network on AfroEduGo.',
};

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    }>
      <CommunityClient />
    </Suspense>
  );
}
