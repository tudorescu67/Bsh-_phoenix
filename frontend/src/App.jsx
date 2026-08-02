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
import FeatureHubPage from './pages/FeatureHubPage';
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
            currentModule={currentModule}
          />
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/jocuri" replace />} />
              <Route path="/muzica" element={<MusicPage />} />
              <Route path="/jocuri" element={<GamesPage />} />
              <Route path="/economie" element={<EconomyPage />} />
              <Route path="/ranks" element={<RanksPage />} />
              <Route path="/moderare" element={<ModerationPage />} />
              <Route path="/setari" element={<SettingsPage />} />
              <Route path="/loguri" element={<LogsPage />} />
              <Route
                path="/selfroles"
                element={
                  <FeatureHubPage
                    title="Self Roles Manager"
                    description="Roluri self-assign cu butoane, categorii, cooldown si validari automate pe server." 
                    pillars={[
                      { icon: '🎛️', name: 'Role Panels', text: 'Panouri multiple cu grupuri de roluri tematice.' },
                      { icon: '🧠', name: 'Rules Engine', text: 'Conditii pentru level, vechime, verificare si blacklist.' },
                      { icon: '⚡', name: 'Instant Sync', text: 'Actualizare instant roluri si audit complet.' },
                    ]}
                  />
                }
              />
              <Route
                path="/templates-server"
                element={
                  <FeatureHubPage
                    title="Server Templates"
                    description="Sistem de sabloane complete pentru server, cu import/export rapid si profile pe comunitati." 
                    pillars={[
                      { icon: '🧱', name: 'Template Builder', text: 'Structuri canale, roluri si permisiuni in profile reutilizabile.' },
                      { icon: '📦', name: 'One-click Apply', text: 'Aplicare controlata pe guild cu preview de schimbari.' },
                      { icon: '🛡️', name: 'Safe Rollback', text: 'Restore rapid daca o configuratie nu este buna.' },
                    ]}
                  />
                }
              />
              <Route
                path="/jarvis-music"
                element={
                  <FeatureHubPage
                    title="Jarvis Voice AI"
                    description="Control vocal, radio fallback inteligent, cache audio si monitorizare pentru sesiuni lungi." 
                    pillars={[
                      { icon: '🎙️', name: 'Voice Commands', text: 'Comenzi naturale pentru play, stop, queue si skip.' },
                      { icon: '📡', name: 'Smart Fallback', text: 'Comutare automata intre surse cand un stream cade.' },
                      { icon: '🧪', name: 'Diagnostics', text: 'Telemetrie erori, reconnect rates si health checks audio.' },
                    ]}
                  />
                }
              />
              <Route
                path="/auto-moderation"
                element={
                  <FeatureHubPage
                    title="Auto Moderation"
                    description="Pipeline anti-spam, anti-link, anti-raid si filtre custom pentru cuvinte, regex si comportamente." 
                    pillars={[
                      { icon: '🚫', name: 'Spam Shield', text: 'Rate limit pe mesaje, mention spam si flood detection.' },
                      { icon: '🔎', name: 'Pattern Filters', text: 'Regex rules cu scoring si decizie automata.' },
                      { icon: '📘', name: 'Action Audit', text: 'Log complet pentru mute, kick, warn si escalation.' },
                    ]}
                  />
                }
              />
              <Route
                path="/welcome-flow"
                element={
                  <FeatureHubPage
                    title="Welcome Flow"
                    description="Flux onboarding cu mesaje animate, funnel pe roluri si triggere pentru retention initial." 
                    pillars={[
                      { icon: '👋', name: 'Welcome Scenes', text: 'Mesaje tematice pe canale, DM si embed-uri vizuale.' },
                      { icon: '🧭', name: 'Guided Setup', text: 'Pas-cu-pas pentru reguli, roluri si introducere rapida.' },
                      { icon: '📈', name: 'Retention Metrics', text: 'Conversie noii membri, drop-off si completare onboarding.' },
                    ]}
                  />
                }
              />
              <Route
                path="/tickets"
                element={
                  <FeatureHubPage
                    title="Tickets & Support"
                    description="Suport modular cu SLA, categorii, assignment automat si templates pentru raspunsuri rapide." 
                    pillars={[
                      { icon: '🎫', name: 'Ticket Queues', text: 'Inbox pe categorii cu prioritate si ownership.' },
                      { icon: '🤝', name: 'Team Workflow', text: 'Assign, transfer, escalare si inchidere cu motive.' },
                      { icon: '📝', name: 'Transcript Export', text: 'Arhivare automatizata si rezumate pentru staff.' },
                    ]}
                  />
                }
              />
              <Route
                path="/games-panel"
                element={
                  <FeatureHubPage
                    title="Games Panel Access"
                    description="Control unificat pentru game servers: start/stop, health, updates si joburi automate." 
                    pillars={[
                      { icon: '🕹️', name: 'Server Actions', text: 'Start, stop, restart cu verificare de stare in timp real.' },
                      { icon: '📊', name: 'Runtime Metrics', text: 'CPU, RAM, players si uptime pentru fiecare instanta.' },
                      { icon: '🛠️', name: 'Maintenance Jobs', text: 'Backup, update si restore programat pe profile.' },
                    ]}
                  />
                }
              />
              <Route
                path="/server-backups"
                element={
                  <FeatureHubPage
                    title="Server Backups"
                    description="Strategie backup incremental cu retentie, restore punctual si sincronizare offsite." 
                    pillars={[
                      { icon: '🗄️', name: 'Snapshot Engine', text: 'Backup incremental pentru date, config si media.' },
                      { icon: '♻️', name: 'Restore Points', text: 'Restore rapid pe orice moment din fereastra de retentie.' },
                      { icon: '☁️', name: 'Offsite Sync', text: 'Replicare automata pe storage extern criptat.' },
                    ]}
                  />
                }
              />
              <Route
                path="/integrations"
                element={
                  <FeatureHubPage
                    title="Integrations Hub"
                    description="Conectori API pentru plati, CRM, alerts, webhooks si automatizari cross-platform." 
                    pillars={[
                      { icon: '🔌', name: 'Webhook Matrix', text: 'Router de evenimente pentru integrari externe.' },
                      { icon: '🔐', name: 'Token Vault', text: 'Gestionare chei, permisiuni si rotire credentale.' },
                      { icon: '⚙️', name: 'Flow Builder', text: 'Automatizari vizuale intre Discord si servicii externe.' },
                    ]}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/jocuri" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
