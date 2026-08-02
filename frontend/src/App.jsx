/* by Capitanul burcea,alex */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MusicPage from './pages/MusicPage';
import GamesPage from './pages/GamesPage';
import EconomyPage from './pages/EconomyPage';
import RanksPage from './pages/RanksPage';
import ModerationPage from './pages/ModerationPage';
import SettingsPage from './pages/SettingsPage';
import LogsPage from './pages/LogsPage';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const ROUTER_BASENAME = import.meta.env.VITE_ROUTER_BASENAME || '/';
const socket = io(SOCKET_URL);

function App() {
  const [isBotOnline, setIsBotOnline] = useState(true);
  const [ping, setPing] = useState('42ms');
  const [uptime, setUpTime] = useState('2d 5h 30m');
  const [currentModule, setCurrentModule] = useState('muzica');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router basename={ROUTER_BASENAME}>
      <div className="app-container">
        <Sidebar currentModule={currentModule} setCurrentModule={setCurrentModule} />
        <div className="main-content">
          <Topbar 
            isBotOnline={isBotOnline} 
            ping={ping} 
            uptime={uptime} 
          />
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/muzica" replace />} />
              <Route path="/muzica" element={<MusicPage />} />
              <Route path="/jocuri" element={<GamesPage />} />
              <Route path="/economie" element={<EconomyPage />} />
              <Route path="/ranks" element={<RanksPage />} />
              <Route path="/moderare" element={<ModerationPage />} />
              <Route path="/setari" element={<SettingsPage />} />
              <Route path="/loguri" element={<LogsPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
