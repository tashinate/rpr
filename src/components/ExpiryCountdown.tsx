import React, { useState, useEffect } from 'react';
import { Clock, Infinity } from 'lucide-react';

interface ExpiryCountdownProps {
  expiresAt?: string | null;
  expiryPreset?: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const ExpiryCountdown: React.FC<ExpiryCountdownProps> = ({ 
  expiresAt, 
  expiryPreset,
  className = "" 
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!expiresAt || expiryPreset === 'lifetime') {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, total: difference });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, expiryPreset]);

  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 text-blue-400" />
        <span className="text-blue-300 font-mono">Loading...</span>
      </div>
    );
  }

  // Lifetime license
  if (expiryPreset === 'lifetime' || !expiresAt) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative">
          <Infinity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-sm animate-pulse"></div>
        </div>
        <span className="text-emerald-300 font-mono font-semibold">Lifetime</span>
      </div>
    );
  }

  // Expired
  if (timeLeft.total <= 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 text-red-400" />
        <span className="text-red-300 font-mono font-semibold">Expired</span>
      </div>
    );
  }

  // Get color based on time remaining
  const getColor = () => {
    const totalHours = timeLeft.total / (1000 * 60 * 60);
    if (totalHours > 24) return 'text-emerald-300';
    if (totalHours > 1) return 'text-yellow-300';
    return 'text-red-300';
  };

  const getIconColor = () => {
    const totalHours = timeLeft.total / (1000 * 60 * 60);
    if (totalHours > 24) return 'text-emerald-400';
    if (totalHours > 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  const shouldAnimate = timeLeft.total < 24 * 60 * 60 * 1000; // Less than 24 hours

  // Format display based on time remaining
  const formatDisplay = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`w-4 h-4 ${getIconColor()} ${shouldAnimate ? 'animate-pulse' : ''}`} />
      <span className={`font-mono font-semibold ${getColor()} ${shouldAnimate ? 'animate-pulse' : ''}`}>
        {formatDisplay()}
      </span>
    </div>
  );
};

export default ExpiryCountdown;