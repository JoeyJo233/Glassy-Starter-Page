import React, { useState, useEffect } from 'react';

interface ClockProps {
  timeFontSize?: number;
  dateFontSize?: number;
  timeOffsetY?: number;
  dateOffsetY?: number;
  textColor?: string;
}

const Clock: React.FC<ClockProps> = ({ timeFontSize = 96, dateFontSize = 24, timeOffsetY = 0, dateOffsetY = 0, textColor = 'rgb(243, 244, 246)' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="text-center drop-shadow-md mb-8 animate-fade-in select-none">
      <h1 
        className="font-bold tracking-tight font-sans"
        style={{ fontSize: `${timeFontSize}px`, transform: `translateY(${timeOffsetY}px)`, color: textColor }}
      >
        {formatTime(time)}
      </h1>
      <p 
        className="mt-2 font-light opacity-90"
        style={{ fontSize: `${dateFontSize}px`, transform: `translateY(${dateOffsetY}px)`, color: textColor }}
      >
        {formatDate(time)}
      </p>
    </div>
  );
};

export default Clock;