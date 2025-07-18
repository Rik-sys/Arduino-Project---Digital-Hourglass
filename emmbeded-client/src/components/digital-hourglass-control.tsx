import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, Compass, Wifi, WifiOff } from 'lucide-react';

const DigitalHourglassControl = () => {
  const [status, setStatus] = useState({
    status: 'stopped',
    progress: 0,
    totalTime: 60,
    elapsed: 0,
    direction: 'UP',
    distances: [999, 999, 999, 999]
  });
  const [minutes, setMinutes] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [arduinoIP, setArduinoIP] = useState('192.168.1.100'); // Default IP - user needs to change this

  // Fetch status from Arduino
  const fetchStatus = async () => {
    try {
      const response = await fetch(`http://${arduinoIP}/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setIsConnected(false);
    }
  };

  // Set timer
  const setTime = async () => {
    try {
      const response = await fetch(`http://${arduinoIP}/setTime?minutes=${minutes}`);
      if (response.ok) {
        console.log('Timer set successfully');
      }
    } catch (error) {
      console.error('Failed to set time:', error);
    }
  };

  // Start timer
  const startTimer = async () => {
    try {
      const response = await fetch(`http://${arduinoIP}/start`);
      if (response.ok) {
        console.log('Timer started');
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  // Stop timer
  const stopTimer = async () => {
    try {
      const response = await fetch(`http://${arduinoIP}/stop`);
      if (response.ok) {
        console.log('Timer stopped');
      }
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  // Auto-refresh status
  useEffect(() => {
    const interval = setInterval(fetchStatus, 1000);
    fetchStatus(); // Initial fetch
    return () => clearInterval(interval);
  }, [arduinoIP]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDirectionIcon = (direction) => {
    switch (direction) {
      case 'UP': return '↑';
      case 'DOWN': return '↓';
      case 'LEFT': return '←';
      case 'RIGHT': return '→';
      default: return '↑';
    }
  };

  const getDirectionColor = (direction) => {
    switch (direction) {
      case 'UP': return 'text-blue-400';
      case 'DOWN': return 'text-green-400';
      case 'LEFT': return 'text-purple-400';
      case 'RIGHT': return 'text-orange-400';
      default: return 'text-blue-400';
    }
  };

  const getSensorColor = (distance) => {
    if (distance < 15) return 'bg-red-500';
    if (distance < 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 mb-4">
            ⏳ Digital Hourglass
          </h1>
          <p className="text-gray-300 text-lg">Smart Arduino-based Sand Timer</p>
        </div>

        {/* Connection Status */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="text-green-400 w-6 h-6" />
              ) : (
                <WifiOff className="text-red-400 w-6 h-6" />
              )}
              <span className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={arduinoIP}
                onChange={(e) => setArduinoIP(e.target.value)}
                placeholder="Arduino IP Address"
                className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Control Panel */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="text-amber-400" />
              Timer Control
            </h2>

            {/* Time Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Set Timer (minutes)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0.1"
                  className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-amber-400 focus:outline-none text-lg"
                />
                <button
                  onClick={setTime}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold"
                >
                  Set
                </button>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={startTimer}
                disabled={status.status === 'running'}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
              >
                <Play className="w-5 h-5" />
                Start
              </button>
              <button
                onClick={stopTimer}
                disabled={status.status === 'stopped'}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
              >
                <Square className="w-5 h-5" />
                Stop
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Progress</span>
                <span>{status.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${Math.min(status.progress, 100)}%` }}
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-gray-300 text-sm">Elapsed</div>
                <div className="text-white text-xl font-mono">{formatTime(status.elapsed)}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-gray-300 text-sm">Total</div>
                <div className="text-white text-xl font-mono">{formatTime(status.totalTime)}</div>
              </div>
            </div>
          </div>

          {/* Status & Sensors Panel */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Compass className="text-blue-400" />
              Status & Sensors
            </h2>

            {/* Current Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-300">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  status.status === 'running' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {status.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Direction:</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 ${getDirectionColor(status.direction)}`}>
                  <span className="text-2xl">{getDirectionIcon(status.direction)}</span>
                  <span className="font-semibold">{status.direction}</span>
                </div>
              </div>
            </div>

            {/* Distance Sensors */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">Distance Sensors</h3>
              
              {['TOP', 'BOTTOM', 'LEFT', 'RIGHT'].map((sensor, index) => (
                <div key={sensor} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-gray-300 font-medium">{sensor}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getSensorColor(status.distances[index])}`} />
                    <span className="text-white font-mono min-w-[60px] text-right">
                      {status.distances[index]}cm
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="text-xs text-gray-400 mt-2">
                🔴 &lt;15cm (Close) | 🟡 15-30cm (Medium) | 🟢 &gt;30cm (Far)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p>Arduino ESP32 Digital Hourglass Project</p>
        </div>
      </div>
    </div>
  );
};

export default DigitalHourglassControl;