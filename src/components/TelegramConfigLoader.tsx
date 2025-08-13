import React, { useState, useEffect } from 'react';
import TelegramConfig from './TelegramConfig';

// Loading wrapper for TelegramConfig to prevent instant database calls
const TelegramConfigLoader: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defer loading slightly to prevent blocking navigation
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 shadow-xl shadow-blue-500/10">
        <div className="space-y-4">
          <div className="h-6 bg-blue-500/20 rounded w-1/3 animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-4 bg-blue-500/20 rounded w-1/4 animate-pulse"></div>
            <div className="h-11 bg-blue-500/20 rounded animate-pulse"></div>
            <div className="h-4 bg-blue-500/20 rounded w-1/4 animate-pulse"></div>
            <div className="h-11 bg-blue-500/20 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-11 bg-blue-500/20 rounded w-20 animate-pulse"></div>
            <div className="h-11 bg-blue-500/20 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return <TelegramConfig />;
};

export default TelegramConfigLoader;