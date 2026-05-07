import React, { useState, useMemo, useEffect } from 'react';
import './HeroModal.css';

// HÀM HỖ TRỢ: Sửa lỗi đường dẫn ảnh (localhost hoặc link web)
const getAvatarUrl = (url) => {
    if (!url) return 'https://placehold.co/80x80?text=Hero';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const HeroModal = ({ isOpen, onClose, heroes, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    // RESET DỮ LIỆU KHI MỞ POPUP
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setRoleFilter('');
            setLaneFilter('');
        }
    }, [isOpen]);

    const allRoles = useMemo(() => {
        const roles = new Set();
        heroes.forEach(h => h.roles?.forEach(r => roles.add(r.name || r)));
        return Array.from(roles);
    }, [heroes]);

    const allLanes = useMemo(() => {
        const lanes = new Set();
        heroes.forEach(h => h.lane?.forEach(l => lanes.add(l)));
        return Array.from(lanes);
    }, [heroes]);

    const filteredHeroes = useMemo(() => {
        return heroes.filter(hero => {
            const matchName = hero.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchRole = roleFilter ? hero.roles?.some(r => (r._id === roleFilter || (r.name || r) === roleFilter)) : true;
            const matchLane = laneFilter ? hero.lane?.includes(laneFilter) : true;
            return matchName && matchRole && matchLane;
        });
    }, [heroes, searchTerm, roleFilter, laneFilter]);

    if (!isOpen) return null;

    return (
        <div className="hero-modal-overlay" onClick={onClose}>
            <div className="hero-modal-content" onClick={e => e.stopPropagation()}>
                <div className="hero-modal-header">
                    <h3>CHỌN TƯỚNG LÂM TRẬN</h3>
                    <button className="btn-close-modal" onClick={onClose}>&times;</button>
                </div>

                <div className="hero-modal-filters">
                    <input 
                        type="text" 
                        placeholder="🔍 Tìm tên tướng..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        autoFocus
                    />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">TẤT CẢ VAI TRÒ</option>
                        {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <select value={laneFilter} onChange={(e) => setLaneFilter(e.target.value)}>
                        <option value="">TẤT CẢ ĐƯỜNG</option>
                        {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                    </select>
                </div>

                <div className="hero-modal-grid">
                    {filteredHeroes.length > 0 ? (
                        filteredHeroes.map(hero => (
                            <div key={hero._id} className="hero-selection-card" onClick={() => { onSelect(hero._id); onClose(); }}>
                                <div className="avatar-wrapper">
                                    <img 
                                        src={getAvatarUrl(hero.avatar)} 
                                        alt={hero.name} 
                                        className="hero-selection-img"
                                        onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=Error' }}
                                    />
                                </div>
                                <span className="hero-selection-name">{hero.name}</span>
                            </div>
                        ))
                    ) : (
                        <div className="no-heroes-found">Không tìm thấy anh hùng phù hợp.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroModal;