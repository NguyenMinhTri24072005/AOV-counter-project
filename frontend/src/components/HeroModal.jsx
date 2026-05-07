import React, { useState, useMemo } from 'react';
import './HeroModal.css';

// HÀM HỖ TRỢ: Sửa lỗi đường dẫn ảnh
const getAvatarUrl = (url) => {
    if (!url) return 'https://placehold.co/80x80?text=No+Image'; // Nếu chưa có ảnh thì dùng ảnh mặc định
    if (url.startsWith('http') || url.startsWith('data:')) return url; // Nếu là link web thì giữ nguyên
    return `http://localhost:5000${url}`; // Nếu là link upload thì gắn thêm port của Backend
};

const HeroModal = ({ isOpen, onClose, heroes, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

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
            const matchRole = roleFilter ? hero.roles?.some(r => (r.name || r) === roleFilter) : true;
            const matchLane = laneFilter ? hero.lane?.includes(laneFilter) : true;
            return matchName && matchRole && matchLane;
        });
    }, [heroes, searchTerm, roleFilter, laneFilter]);

    if (!isOpen) return null;

    return (
        <div className="hero-modal-overlay" onClick={onClose}>
            <div className="hero-modal-content" onClick={e => e.stopPropagation()}>
                <div className="hero-modal-header">
                    <h3>Chọn Tướng</h3>
                    <button className="btn-close-modal" onClick={onClose}>&times;</button>
                </div>

                <div className="hero-modal-filters">
                    <input 
                        type="text" 
                        placeholder="🔍 Nhập tên tướng..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        autoFocus
                    />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">Tất cả Vai trò</option>
                        {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <select value={laneFilter} onChange={(e) => setLaneFilter(e.target.value)}>
                        <option value="">Tất cả Đường</option>
                        {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                    </select>
                </div>

                <div className="hero-modal-grid">
                    {filteredHeroes.length > 0 ? (
                        filteredHeroes.map(hero => (
                            <div key={hero._id} className="hero-card" onClick={() => { onSelect(hero._id); onClose(); }}>
                                {/* ĐÃ FIX: Sử dụng getAvatarUrl tại đây */}
                                <img 
                                    src={getAvatarUrl(hero.avatar)} 
                                    alt={hero.name} 
                                    className="hero-avatar"
                                    onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=Error' }} // Chống vỡ khung nếu ảnh lỗi
                                />
                                <span className="hero-name-label">{hero.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="no-heroes-found">Không tìm thấy tướng phù hợp.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroModal;