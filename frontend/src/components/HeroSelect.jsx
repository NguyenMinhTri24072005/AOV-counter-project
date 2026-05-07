import React, { useState } from 'react';
import HeroModal from './HeroModal';

const HeroSelect = ({ label, heroes, selectedHeroId, onChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedHero = heroes.find(h => h._id === selectedHeroId);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 'bold', color: '#444' }}>{label}</label>
            <button 
                onClick={() => setIsModalOpen(true)}
                style={{
                    padding: '10px 15px', background: 'white', border: '1px solid #ccc',
                    borderRadius: '6px', cursor: 'pointer', minWidth: '200px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontWeight: selectedHero ? 'bold' : 'normal', color: selectedHero ? '#007bff' : '#666'
                }}
            >
                {selectedHero ? `🦸 ${selectedHero.name}` : '-- Bấm để chọn tướng --'}
                <span>▼</span>
            </button>

            <HeroModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                heroes={heroes} 
                onSelect={(id) => onChange(id)} 
            />
        </div>
    );
};

export default HeroSelect;