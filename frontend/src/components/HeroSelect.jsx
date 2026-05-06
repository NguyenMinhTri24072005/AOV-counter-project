import React from 'react';
import './HeroSelect.css'; // Import file CSS

const HeroSelect = ({ heroes, selectedHeroId, onChange, label }) => {
    return (
        <div className="hero-select-container">
            <label className="hero-select-label">{label}</label>
            <select 
                className="hero-select-dropdown"
                value={selectedHeroId || ""} 
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" disabled>-- Chọn tướng --</option>
                {heroes.map(hero => (
                    <option key={hero._id} value={hero._id}>
                        {hero.name} - {hero.role}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default HeroSelect;