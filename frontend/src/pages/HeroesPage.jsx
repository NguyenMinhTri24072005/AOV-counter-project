import React, { useState, useEffect, useMemo } from 'react';
import { getHeroes } from '../services/api';
import './Admin/Admin.css'; 

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/50x50?text=Hero';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const HeroesPage = () => {
    const [heroes, setHeroes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedLane, setSelectedLane] = useState('');
    
    // 🌟 STATE CHO MODAL CHI TIẾT
    const [viewingHero, setViewingHero] = useState(null);

    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                const res = await getHeroes();
                setHeroes(res.data);
            } catch (err) {
                console.error("Lỗi khi tải tướng:", err);
            }
        };
        fetchHeroes();
    }, []);

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

    const filteredHeroes = heroes.filter(h => {
        const matchName = h.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = selectedRole ? h.roles?.some(r => (r.name || r) === selectedRole || r._id === selectedRole) : true;
        const matchLane = selectedLane ? h.lane?.includes(selectedLane) : true;
        return matchName && matchRole && matchLane;
    });

    return (
        <div className="admin-manage-container" style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '50px' }}>
            <h2 className="admin-page-title">🛡️ TỪ ĐIỂN TƯỚNG ({filteredHeroes.length})</h2>
            
            {/* Bộ lọc giữ nguyên */}
            <div className="filter-bar" style={{ marginBottom: '30px', display: 'flex', gap: '15px', background: 'rgba(30, 41, 59, 0.7)', padding: '15px', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap' }}>
                <input type="text" placeholder="🔍 Tìm tên tướng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input" style={{ flex: '2', minWidth: '250px', padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px' }} />
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ flex: '1', minWidth: '150px', padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px' }}>
                    <option value="">🛡️ VAI TRÒ</option>
                    {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <select value={selectedLane} onChange={(e) => setSelectedLane(e.target.value)} style={{ flex: '1', minWidth: '150px', padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px' }}>
                    <option value="">🗺️ ĐƯỜNG</option>
                    {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                </select>
            </div>

            {/* Danh sách tướng */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '20px' }}>
                {filteredHeroes.map(hero => (
                    <div key={hero._id} className="hero-card-clickable" 
                        onClick={() => setViewingHero(hero)} // 🌟 CLICK VÀO ĐÂY
                        style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '15px 10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'all 0.3s', cursor: 'pointer' }}
                    >
                        <img src={getImgUrl(hero.avatar)} alt={hero.name} style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6', marginBottom: '10px' }} />
                        <h3 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '15px' }}>{hero.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10px' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{hero.roles?.map(r => r.name || r).join('/')}</span>
                            <span style={{ color: '#10b981' }}>{hero.lane?.join(', ')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🌟 MODAL CHI TIẾT TƯỚNG 🌟 */}
            {viewingHero && (
                <div className="hero-detail-overlay" onClick={() => setViewingHero(null)}>
                    <div className="hero-detail-modal cyber-panel" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setViewingHero(null)}>×</button>
                        
                        <div className="modal-header">
                            <img src={getImgUrl(viewingHero.avatar)} alt="avatar" className="modal-avatar" />
                            <div className="header-info">
                                <h2 className="hero-name-large">{viewingHero.name}</h2>
                                <div className="hero-badges">
                                    {viewingHero.roles?.map((r, i) => <span key={i} className="badge role">{r.name || r}</span>)}
                                    {viewingHero.lane?.map((l, i) => <span key={i} className="badge lane">{l}</span>)}
                                </div>
                            </div>
                        </div>

                        <div className="modal-body-scroll">
                            <h3 className="section-title">⚔️ BỘ KỸ NĂNG</h3>
                            <div className="skills-container">
                                {Object.entries(viewingHero.skills || {}).map(([key, value]) => {
                                    if (!value) return null;
                                    const [name, desc] = value.split(': ');
                                    const labelMap = {
                                        passive: 'Nội tại',
                                        skill1: 'Chiêu 1',
                                        skill2: 'Chiêu 2',
                                        skill3: 'Chiêu 3',
                                        skill4: 'Chiêu 4'
                                    };
                                    return (
                                        <div key={key} className="skill-item">
                                            <div className="skill-label">{labelMap[key]}</div>
                                            <div className="skill-content">
                                                <strong className="skill-name">{name}</strong>
                                                <p className="skill-desc">{desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroesPage;