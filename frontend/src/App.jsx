import React, { useState, useEffect } from 'react';
import { getHeroes } from './services/api';
import SoloCounter from './components/SoloCounter';
import DraftMode from './components/DraftMode';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('solo');
  const [heroes, setHeroes] = useState([]);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await getHeroes();
        setHeroes(response.data);
      } catch (error) {
        console.error("Lỗi không lấy được danh sách tướng:", error);
      }
    };
    fetchHeroes();
  }, []);

  return (
    <div className="app-container">
      <h1 className="app-header">🛡️ Liên Quân Counter Pick</h1>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'solo' ? 'active' : ''}`}
          onClick={() => setActiveTab('solo')}
        >
          🔍 Solo Counter
        </button>
        <button
          className={`tab-button ${activeTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          ⚔️ Draft Mode (Cấm/Chọn)
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'solo' && <SoloCounter heroes={heroes} />}

        {activeTab === 'draft' && <DraftMode heroes={heroes} />}
      </div>
    </div>
  );
}

export default App;