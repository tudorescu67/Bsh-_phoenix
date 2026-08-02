/* by Capitanul burcea,alex */
import React, { useEffect, useRef, useState } from 'react';
import './MusicPage.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / (1024 ** unitIndex);
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function MusicPage() {
  const [volume, setVolume] = useState(70);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSong] = useState({
    title: 'Manele Fierbinti 2026',
    artist: 'Various Artists',
    duration: '3:45',
    progress: 45
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploaderName, setUploaderName] = useState('Dashboard User');
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [previewTrackName, setPreviewTrackName] = useState('');
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const queue = [
    { id: 1, title: 'Colaj Manele', artist: 'Carmen de la Salciua', duration: '4:20' },
    { id: 2, title: 'Suflet de Bagabont', artist: 'Andrei Banuta', duration: '3:55' },
    { id: 3, title: 'Pe La Spate', artist: 'Florin Salam', duration: '3:30' }
  ];

  const fetchLibrary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/library`);
      if (!response.ok) throw new Error('Nu am putut incarca libraria.');

      const payload = await response.json();
      setLibraryTracks(Array.isArray(payload.tracks) ? payload.tracks : []);
    } catch {
      setLibraryTracks([]);
    }
  };

  useEffect(() => {
    fetchLibrary();

    const rememberedName = window.localStorage.getItem('musicUploaderName');
    if (rememberedName) setUploaderName(rememberedName);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSelectFile = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadStatus(file ? `Selectat: ${file.name}` : '');
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) {
      if (!selectedFile) setUploadStatus('Alege mai intai un fisier audio.');
      return;
    }

    setUploading(true);
    setUploadStatus('Se incarca fisierul...');

    try {
      const body = new FormData();
      body.append('musicFile', selectedFile);
      body.append('uploadedBy', uploaderName || 'Dashboard User');

      const response = await fetch(`${API_BASE_URL}/api/music/upload`, {
        method: 'POST',
        body,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Upload esuat.');
      }

      setUploadStatus(`Upload reusit: ${payload.track?.name || selectedFile.name}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchLibrary();
    } catch (error) {
      setUploadStatus(error.message || 'Upload esuat.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploaderChange = (event) => {
    const value = event.target.value;
    setUploaderName(value);
    window.localStorage.setItem('musicUploaderName', value);
  };

  const togglePreview = async (trackName) => {
    try {
      if (audioRef.current && previewTrackName === trackName && !audioRef.current.paused) {
        audioRef.current.pause();
        setUploadStatus(`Preview oprit: ${trackName}`);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const streamUrl = `${API_BASE_URL}/api/music/library/${encodeURIComponent(trackName)}/stream`;
      const audio = new Audio(streamUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setPreviewTrackName('');
      };

      await audio.play();
      setPreviewTrackName(trackName);
      setUploadStatus(`🎧 Preview: ${trackName}`);
    } catch {
      setUploadStatus('Nu am putut porni preview-ul audio.');
    }
  };

  return (
    <div className="music-page">
      <div className="page-header">
        <h1 className="page-title">🎵 Muzică</h1>
        <p className="page-desc">Control player și coadă muzicală</p>
      </div>

      <div className="music-grid">
        <div className="player-card">
          <div className="player-visual">
            <div className="album-art">🎶</div>
          </div>
          
          <div className="player-info">
            <h2 className="song-title">{currentSong.title}</h2>
            <p className="song-artist">{currentSong.artist}</p>
          </div>

          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${currentSong.progress}%` }}
              ></div>
            </div>
            <div className="time-info">
              <span className="current-time">1:42</span>
              <span className="total-time">{currentSong.duration}</span>
            </div>
          </div>

          <div className="player-controls">
            <button className="control-btn">🔀</button>
            <button className="control-btn">⏮️</button>
            <button 
              className="control-btn play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button className="control-btn">⏭️</button>
            <button className="control-btn">🔁</button>
          </div>

          <div className="volume-section">
            <span className="volume-icon">🔊</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="volume-slider"
            />
            <span className="volume-value">{volume}%</span>
          </div>
        </div>

        <div className="queue-card">
          <div className="queue-header">
            <h3>📋 Coadă ({queue.length})</h3>
            <button className="clear-btn">Golește</button>
          </div>
          
          <div className="queue-list">
            {queue.map((song, index) => (
              <div key={song.id} className="queue-item">
                <div className="queue-number">{index + 1}</div>
                <div className="queue-info">
                  <div className="queue-title">{song.title}</div>
                  <div className="queue-artist">{song.artist}</div>
                </div>
                <div className="queue-duration">{song.duration}</div>
                <button className="queue-remove">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">⚙️ Setări</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Volum implicit</label>
            <input type="number" defaultValue={70} min="0" max="100" />
          </div>
          <div className="setting-item">
            <label>DJ Role</label>
            <select>
              <option>@DJ</option>
              <option>@Moderator</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Auto-join canal</label>
            <select>
              <option>#General</option>
              <option>#Muzică</option>
            </select>
          </div>
        </div>
      </div>

      <div className="upload-section">
        <div className="upload-header">
          <h3 className="section-title">➕ Add Music</h3>
          <p className="upload-desc">Încarcă fișiere audio din PC direct în librăria player-ului.</p>
          <p className="upload-desc">Limită per fișier: 40MB (aprox. până la 30 minute, în funcție de bitrate).</p>
        </div>

        <div className="upload-uploader-row">
          <label htmlFor="upload-uploader" className="upload-uploader-label">Cine urcă muzica</label>
          <input
            id="upload-uploader"
            type="text"
            value={uploaderName}
            onChange={handleUploaderChange}
            className="upload-uploader-input"
            placeholder="Nume uploader"
            maxLength={80}
          />
        </div>

        <div className="upload-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.flac,.opus,.webm,audio/*"
            onChange={handleSelectFile}
            className="upload-file-input"
          />
          <button
            type="button"
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Se încarcă...' : 'Upload în Music Library'}
          </button>
        </div>

        {uploadStatus ? <p className="upload-status">{uploadStatus}</p> : null}

        <div className="library-box">
          <h4 className="library-title">Librărie locală ({libraryTracks.length})</h4>
          <div className="library-list">
            {libraryTracks.length === 0 ? (
              <div className="library-empty">Nu există încă fișiere încărcate.</div>
            ) : (
              libraryTracks.slice(0, 8).map((track) => (
                <div key={`${track.name}-${track.uploadedAt}`} className="library-item">
                  <div className="library-left">
                    <div className="library-name">{track.name}</div>
                    <div className="library-meta">
                      {formatBytes(track.sizeBytes)} • by {track.uploadedBy || 'Unknown'}
                    </div>
                  </div>
                  <div className="library-actions">
                    <button
                      type="button"
                      className={`preview-btn ${previewTrackName === track.name ? 'active' : ''}`}
                      onClick={() => togglePreview(track.name)}
                      title="Ascultă / Oprește"
                    >
                      👂
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicPage;
