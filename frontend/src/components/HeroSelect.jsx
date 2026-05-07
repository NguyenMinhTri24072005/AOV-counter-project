import React, { useState } from 'react';
import HeroModal from './HeroModal';
import './HeroSelect.css';

const getAvatarUrl = (url) => {
    if (!url) return 'https://placehold.co/100x100?text=Select';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const HeroSelect = ({ heroes, selectedHeroId, onChange, isEnemy = false }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const selectedHero = heroes.find(h => h._id === selectedHeroId);

    return (
        <div className={`hero-select-slot ${isEnemy ? 'enemy-slot' : 'ally-slot'}`}>
            <button 
                type="button" /* Fix lỗi auto-submit */
                className={`slot-trigger-btn ${selectedHero ? 'has-hero' : ''}`} 
                onClick={() => setIsModalOpen(true)}
            >
                {selectedHero ? (
                    <div className="hero-content">
                        <img src={getAvatarUrl(selectedHero.avatar)} alt="avatar" className="hero-img" />
                        <div className="hero-name-overlay">{selectedHero.name}</div>
                    </div>
                ) : (
                    <div className="empty-content">
                        <span className="plus-icon">+</span>
                        <span className="btn-text">CHỌN TƯỚNG</span>
                    </div>
                )}
            </button>

            <HeroModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                heroes={heroes} 
                onSelect={(id) => {
                    onChange(id);
                    setIsModalOpen(false);
                }} 
            />
        </div>
    );
};

export default HeroSelect;