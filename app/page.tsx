'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Skip the Queue, Save Your Time
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Know real-time crowd levels at government offices across India
        </p>
        <Link
          href="/search"
          className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg"
        >
          Find Offices Near You
        </Link>
      </div>

      {/* Problem Statement */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          The Problem We're Solving
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Every day, millions of Indians waste hours standing in long queues at government offices. 
          Whether it's getting a passport, Aadhaar card, driving license, or any other document, 
          the uncertainty of waiting times causes frustration and lost productivity.
        </p>
        <p className="text-gray-700 leading-relaxed">
          <strong>Queueless India</strong> helps you make informed decisions by showing real-time 
          crowd levels and estimated waiting times, so you can visit when it's less crowded.
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          How It Works
        </h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold mr-4">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Search Your City</h3>
              <p className="text-gray-600 text-sm">
                Select your city and the type of office you need to visit
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold mr-4">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Check Crowd Levels</h3>
              <p className="text-gray-600 text-sm">
                See real-time crowd status (Low/Medium/High) and estimated waiting times
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold mr-4">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Plan Your Visit</h3>
              <p className="text-gray-600 text-sm">
                Get AI-powered insights on why it's crowded and the best time to visit
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold mr-4">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Help Others</h3>
              <p className="text-gray-600 text-sm">
                {isAuthenticated 
                  ? "Update crowd levels when you visit to help fellow citizens"
                  : "Sign in to report crowd levels and help others save time"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-5 text-center">
          <div className="text-3xl mb-2">📍</div>
          <h3 className="font-semibold text-gray-900 mb-2">Real-Time Data</h3>
          <p className="text-sm text-gray-600">
            Crowd reports from citizens updated in real-time
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 text-center">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="font-semibold text-gray-900 mb-2">AI Insights</h3>
          <p className="text-sm text-gray-600">
            Smart explanations and visit timing suggestions
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 text-center">
          <div className="text-3xl mb-2">🗺️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Easy Navigation</h3>
          <p className="text-sm text-gray-600">
            Find offices on map with distance calculations
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/search"
          className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Get Started Now →
        </Link>
      </div>
    </div>
  );
}
