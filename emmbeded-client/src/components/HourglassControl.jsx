// import { useEffect, useState } from "react";

// const ESP32_IP = "192.168.137.11"; // שנה ל-IP שקיבלת ב-Serial Monitor

// export default function HourglassControl() {
//   const [minutes, setMinutes] = useState(1);
//   const [status, setStatus] = useState("Disconnected");
//   const [progress, setProgress] = useState(0);

//   const setTime = async () => {
//     try {
//       await fetch(`${ESP32_IP}/setTime?minutes=${minutes}`);
//     } catch (err) {
//       console.error("Set time error:", err);
//     }
//   };

//   const start = async () => {
//     try {
//       await fetch(`${ESP32_IP}/start`);
//     } catch (err) {
//       console.error("Start error:", err);
//     }
//   };

//   const stop = async () => {
//     try {
//       await fetch(`${ESP32_IP}/stop`);
//     } catch (err) {
//       console.error("Stop error:", err);
//     }
//   };

//   const fetchStatus = async () => {
//     try {
//       const res = await fetch(`${ESP32_IP}/status`);
//       const data = await res.json();
//       setStatus(data.status);
//       setProgress(data.progress.toFixed(1));
//     } catch {
//       setStatus("Disconnected");
//       setProgress(0);
//     }
//   };

//   useEffect(() => {
//     const interval = setInterval(fetchStatus, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl border text-center">
//       <h1 className="text-2xl font-bold mb-4">📦 Digital Hourglass Control</h1>

//       <label className="block mb-2 font-medium">⏱️ זמן (בדקות):</label>
//       <input
//         type="number"
//         value={minutes}
//         onChange={(e) => setMinutes(e.target.value)}
//         min="0.1"
//         step="0.1"
//         className="w-full p-2 border rounded mb-4"
//       />

//       <div className="flex gap-2 justify-center mb-4">
//         <button
//           onClick={setTime}
//           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//         >
//           הגדר זמן
//         </button>
//         <button
//           onClick={start}
//           className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
//         >
//           התחל
//         </button>
//         <button
//           onClick={stop}
//           className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//         >
//           עצור
//         </button>
//       </div>

//       <div className="text-left mt-4">
//         <p>
//           📡 מצב: <strong>{status}</strong>
//         </p>
//         <p>
//           📈 התקדמות: <strong>{progress}%</strong>
//         </p>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";

0
export default function HourglassControl() {
  const [minutes, setMinutes] = useState(1);
  const [status, setStatus] = useState("Disconnected");
  const [progress, setProgress] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  const setTime = async () => {
    try {
      const response = await fetch(`${ESP32_IP}/setTime?minutes=${minutes}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Time set:", data.message);
      }
    } catch (err) {
      console.error("Set time error:", err);
      setConnectionStatus("Connection Failed");
    }
  };

  const start = async () => {
    try {
      const response = await fetch(`${ESP32_IP}/start`);
      if (response.ok) {
        const data = await response.json();
        console.log("Started:", data.message);
      }
    } catch (err) {
      console.error("Start error:", err);
      setConnectionStatus("Connection Failed");
    }
  };

  const stop = async () => {
    try {
      const response = await fetch(`${ESP32_IP}/stop`);
      if (response.ok) {
        const data = await response.json();
        console.log("Stopped:", data.message);
      }
    } catch (err) {
      console.error("Stop error:", err);
      setConnectionStatus("Connection Failed");
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${ESP32_IP}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setProgress(parseFloat(data.progress) || 0);
        setIsFlipped(data.flipped || false);
        setConnectionStatus("Connected");
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (err) {
      setStatus("Disconnected");
      setProgress(0);
      setConnectionStatus("Disconnected");
    }
  };

  useEffect(() => {
    // בדיקה ראשונית
    fetchStatus();
    
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const getProgressColor = () => {
    if (progress < 30) return "bg-green-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusIcon = () => {
    switch (status) {
      case "running": return "⏳";
      case "stopped": return "⏸️";
      default: return "❓";
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "Connected": return "🟢";
      case "Disconnected": return "🔴";
      default: return "🟡";
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-8 bg-gradient-to-br from-blue-50 to-purple-50 shadow-2xl rounded-2xl border border-gray-200">
      {/* כותרת */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ⏳ שעון חול דיגיטלי
        </h1>
        <div className="flex justify-center items-center gap-2 text-sm">
          <span>{getConnectionIcon()}</span>
          <span className={`font-medium ${connectionStatus === "Connected" ? "text-green-600" : "text-red-600"}`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* הגדרת זמן */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
        <label className="block text-gray-700 font-medium mb-3">
          ⏱️ זמן הטיימר (בדקות):
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(parseFloat(e.target.value) || 0.1)}
            min="0.1"
            step="0.1"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="1.0"
          />
          <button
            onClick={setTime}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            הגדר
          </button>
        </div>
      </div>

      {/* כפתורי בקרה */}
      <div className="flex gap-3 justify-center mb-6">
        <button
          onClick={start}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
        >
          ▶️ התחל
        </button>
        <button
          onClick={stop}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
        >
          ⏹️ עצור
        </button>
      </div>

      {/* מידע על מצב השעון */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        {/* מצב הטיימר */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">מצב:</span>
          <div className="flex items-center gap-2">
            <span>{getStatusIcon()}</span>
            <span className={`font-bold ${status === "running" ? "text-green-600" : "text-gray-600"}`}>
              {status === "running" ? "פועל" : status === "stopped" ? "עצור" : "לא זמין"}
            </span>
          </div>
        </div>

        {/* התקדמות */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">התקדמות:</span>
            <span className="font-bold text-gray-800">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* כיוון השעון */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">כיוון השעון:</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {isFlipped ? "🔄" : "⬆️"}
            </span>
            <span className={`font-bold ${isFlipped ? "text-blue-600" : "text-yellow-600"}`}>
              {isFlipped ? "הפוך" : "רגיל"}
            </span>
          </div>
        </div>

        {/* אזור הוראות */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>הוראות:</strong> הפוך את השעון פיזית כדי לשנות את כיוון נפילת החול
          </p>
        </div>
      </div>

      {/* חיווי ויזואלי של השעון */}
      <div className="mt-6 flex justify-center">
        <div className="relative">
          <div className={`w-16 h-24 border-4 rounded-lg transition-all duration-500 ${
            isFlipped 
              ? "border-blue-500 bg-gradient-to-t from-blue-100 to-green-100" 
              : "border-yellow-500 bg-gradient-to-b from-yellow-100 to-orange-100"
          }`}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-1 bg-gray-400 rounded"></div>
            </div>
          </div>
          <div className="text-center mt-2 text-xs text-gray-500">
            דמיית השעון
          </div>
        </div>
      </div>
    </div>
  );
}
