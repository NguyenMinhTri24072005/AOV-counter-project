import React, { useState, useContext } from 'react';
import { getCounters, getStrategies } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ModeToggle from './ModeToggle';
import HeroModal from './HeroModal';
import './SoloCounter.css'; 

const getAvatarUrl = (url, type = 'hero') => {
    if (!url) return type === 'hero' ? 'https://placehold.co/80x80?text=Hero' : 'https://placehold.co/60x60?text=Item';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const SoloCounter = ({ heroes }) => {
    const { user } = useContext(AuthContext);
    const [viewMode, setViewMode] = useState('standard');
    
    // STATE ĐA SECTION
    const [sections, setSections] = useState([
        { id: Date.now(), enemyHeroId: null, results: [], targetCounters: [], relatedStrategies: [], loading: false, searchTerm: '', filterLane: '', filterRole: '' }
    ]);

    // STATE MODAL & TARGET
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState(null);
    
    // THÊM MỚI: TÁCH RIÊNG 2 STATE CHO 2 LOẠI MODAL KHÁC NHAU
    const [selectedMatchupDetail, setSelectedMatchupDetail] = useState(null);
    const [selectedStrategyDetail, setSelectedStrategyDetail] = useState(null);

    const heroesList = Array.isArray(heroes) ? heroes : (heroes?.data || []);
    const uniqueLanes = [...new Set(heroesList.flatMap(h => h.lane || []))];
    const uniqueRoles = [...new Set(heroesList.flatMap(h => h.roles?.map(r => r.name || r) || []))];

    const getHeroName = (id) => heroesList.find(h => h._id === id)?.name || "Unknown";
    const getHeroAvatar = (id) => heroesList.find(h => h._id === id)?.avatar || "";

    // QUẢN LÝ SECTIONS VÀ FILTER CỤC BỘ
    const addSection = () => setSections([...sections, { id: Date.now() + Math.random(), enemyHeroId: null, results: [], targetCounters: [], relatedStrategies: [], loading: false, searchTerm: '', filterLane: '', filterRole: '' }]);
    const removeSection = (id) => {
        if (sections.length > 1) setSections(sections.filter(s => s.id !== id));
        else setSections([{ id: Date.now(), enemyHeroId: null, results: [], targetCounters: [], relatedStrategies: [], loading: false, searchTerm: '', filterLane: '', filterRole: '' }]);
    };

    const handleFilterChange = (sectionId, field, value) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s));
    };

    const openHeroModal = (sectionId) => {
        setTargetSectionId(sectionId);
        setIsModalOpen(true);
    };

    const handleSelectEnemy = (heroId) => {
        setSections(sections.map(s => s.id === targetSectionId ? { ...s, enemyHeroId: heroId, results: [], targetCounters: [], relatedStrategies: [], searchTerm: '', filterLane: '', filterRole: '' } : s));
        setIsModalOpen(false);
    };

    // LOGIC PHÂN TÍCH
    const handleAnalyze = async (sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section.enemyHeroId) return toast.warning("Vui lòng chọn mục tiêu!");

        setSections(sections.map(s => s.id === sectionId ? { ...s, loading: true } : s));
        try {
            const [counterRes, stratRes] = await Promise.all([
                getCounters([], [], 'pro', user?.id, 1, 1000), 
                getStrategies('pro', user?.id, 1, 1000)
            ]);

            const allCounters = counterRes.data?.data ? counterRes.data.data : counterRes.data;
            const allStrats = stratRes.data?.data ? stratRes.data.data : stratRes.data;

            const countersTheTarget = allCounters.map(h => ({
                ...h, matchupDetails: h.matchupDetails.filter(d => d.enemyId === section.enemyHeroId)
            })).filter(h => h.matchupDetails.length > 0);

            const targetCountersThemObj = allCounters.find(h => (h.hero._id || h.hero) === section.enemyHeroId);
            const targetCountersArr = targetCountersThemObj ? [targetCountersThemObj] : [];

            const relatedStrats = allStrats.filter(strat => {
                const targetId = section.enemyHeroId;
                if (strat.type === 'combo_counter' || strat.type === 'skill_matchup') return strat.teamB?.some(h => (h._id || h) === targetId) || strat.teamA?.some(h => (h._id || h) === targetId);
                if (strat.type === 'synergy') return strat.teamA?.some(h => (h._id || h) === targetId);
                return false;
            });

            setSections(sections.map(s => s.id === sectionId ? { 
                ...s, results: countersTheTarget, targetCounters: targetCountersArr, relatedStrategies: relatedStrats, loading: false 
            } : s));
        } catch (error) {
            console.error("Lỗi phân tích:", error);
            setSections(sections.map(s => s.id === sectionId ? { ...s, loading: false } : s));
        }
    };

    // LOGIC ĐÓNG MỞ CÁC LOẠI MODAL CHI TIẾT
    const handleOpenMatchupDetail = (dataObj, detail, isThreatBox = false) => {
        setSelectedMatchupDetail({
            counterHero: dataObj.hero, enemyHeroId: detail.enemyId,
            score: detail.score, note: detail.note,
            counterItems: detail.counterItems || [], recommendedItems: dataObj.recommendedItems || [],
            authorName: detail.authorName, isSystem: detail.isSystem, isThreatBox
        });
    };
    const closeMatchupDetail = () => setSelectedMatchupDetail(null);

    const handleOpenStrategyDetail = (strat) => setSelectedStrategyDetail(strat);
    const closeStrategyDetail = () => setSelectedStrategyDetail(null);

    // THUẬT TOÁN LỌC TỐI ƯU
    const applyFiltersToHeroes = (cards, section) => {
        const { searchTerm, filterLane, filterRole } = section;
        return cards.filter(card => {
            const originalHero = heroesList.find(h => h._id === (card.hero._id || card.hero));
            if (!originalHero) return false;

            const matchName = originalHero.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchLane = filterLane ? originalHero.lane?.includes(filterLane) : true;
            const heroRoles = originalHero.roles?.map(r => r.name || r) || [];
            const matchRole = filterRole ? heroRoles.includes(filterRole) : true;
            
            return matchName && matchLane && matchRole;
        });
    };

    // GIAO DIỆN COMPACT CHO KHU VỰC 1 (NÊN CHỌN)
    const renderRecommendCards = (rawCardsList, sourceFilter, section) => {
        let cardsList = applyFiltersToHeroes(rawCardsList, section);
        if (sourceFilter === 'system') cardsList = cardsList.map(h => ({ ...h, matchupDetails: h.matchupDetails.filter(d => d.isSystem) })).filter(h => h.matchupDetails.length > 0);
        else if (sourceFilter === 'personal') cardsList = cardsList.map(h => ({ ...h, matchupDetails: h.matchupDetails.filter(d => !d.isSystem) })).filter(h => h.matchupDetails.length > 0);

        if (cardsList.length === 0) return <p className="no-results txt-sm text-center">Không có dữ liệu phù hợp với bộ lọc.</p>;

        return (
            <div className="compact-recommendation-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {cardsList.map((dataObj) => {
                    // SỬA LỖI ĐIỂM: Lấy điểm số cao nhất khắc chế mục tiêu thay vì lấy Điểm tổng
                    const specificScore = Math.max(...dataObj.matchupDetails.map(d => d.score || 0));

                    return (
                        <div key={dataObj.hero._id} className="compact-rec-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #10b981', borderRadius: '8px', padding: '15px', transition: '0.3s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={getAvatarUrl(dataObj.hero.avatar)} alt="hero" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #38bdf8', objectFit: 'cover' }} />
                                    <div><strong style={{ fontSize: '15px', color: '#fff' }}>{dataObj.hero.name}</strong></div>
                                </div>
                                <span className="score-badge bg-recommend" style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}>{specificScore} Điểm</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Khắc chế:</span>
                                {dataObj.matchupDetails.map((detail, idx) => (
                                    <div key={idx} onClick={() => handleOpenMatchupDetail(dataObj, detail, false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer', border: '1px solid #475569', transition: '0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.background = '#1e293b'; }}
                                        title="Bấm xem chi tiết"
                                    >
                                        <img src={getAvatarUrl(getHeroAvatar(detail.enemyId))} alt="enemy" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0' }}>{getHeroName(detail.enemyId)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // GIAO DIỆN COMPACT CHO KHU VỰC 2 (NẠN NHÂN)
    const renderVictimCards = (targetCountersArr, sourceFilter, section) => {
        if (!targetCountersArr || targetCountersArr.length === 0) return <p className="no-results txt-sm text-center">Chưa có dữ liệu tướng bị mục tiêu khắc chế.</p>;
        
        const mainTarget = targetCountersArr[0].hero;
        let details = targetCountersArr[0].matchupDetails;

        if (sourceFilter === 'system') details = details.filter(d => d.isSystem);
        else if (sourceFilter === 'personal') details = details.filter(d => !d.isSystem);

        details = details.filter(d => {
            const enemyHero = heroesList.find(h => h._id === d.enemyId);
            if (!enemyHero) return false;
            
            const matchName = enemyHero.name.toLowerCase().includes(section.searchTerm.toLowerCase());
            const matchLane = section.filterLane ? enemyHero.lane?.includes(section.filterLane) : true;
            const heroRoles = enemyHero.roles?.map(r => r.name || r) || [];
            const matchRole = section.filterRole ? heroRoles.includes(section.filterRole) : true;
            
            return matchName && matchLane && matchRole;
        });

        if (details.length === 0) return <p className="no-results txt-sm text-center">Không có nạn nhân nào khớp với bộ lọc.</p>;

        return (
            <div className="compact-recommendation-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {details.map((detail, idx) => {
                    const victimHero = heroesList.find(h => h._id === detail.enemyId);
                    return (
                        <div key={idx} className="compact-rec-card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #ef4444', borderRadius: '8px', padding: '15px', transition: '0.3s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239,68,68,0.2)', paddingBottom: '10px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={getAvatarUrl(victimHero.avatar)} alt="victim" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #ef4444', objectFit: 'cover' }} />
                                    <div><strong style={{ fontSize: '15px', color: '#fff' }}>{victimHero.name}</strong></div>
                                </div>
                                <span className="score-badge bg-threat" style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}>BỊ HẠ ({detail.score}đ)</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#fca5a5' }}>Khắc chế bởi:</span>
                                <div onClick={() => handleOpenMatchupDetail({ hero: mainTarget, recommendedItems: targetCountersArr[0].recommendedItems }, detail, true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#7f1d1d', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer', border: '1px solid #ef4444', transition: '0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#991b1b'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#7f1d1d'; }}
                                    title="Bấm xem chi tiết"
                                >
                                    <img src={getAvatarUrl(mainTarget.avatar)} alt="enemy" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fee2e2' }}>{mainTarget.name}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    };

    // GIAO DIỆN COMPACT CHO KHU VỰC 3 (CHIẾN THUẬT NÂNG CAO CÓ POPUP)
    const renderAdvancedCards = (stratList, title, themeColor) => {
        if (!stratList || stratList.length === 0) return null;
        const getFilteredStrats = (list, sourceFilter) => list.filter(s => sourceFilter === 'system' ? s.isSystem : !s.isSystem);

        const StrategyList = ({ data }) => {
            if (data.length === 0) return <p className="no-results txt-sm text-center">Không có chiến thuật này.</p>;
            return (
                <div className="strat-advanced-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                    {data.map(strat => (
                        <div 
                            key={strat._id} 
                            className="strat-advanced-card" 
                            onClick={() => handleOpenStrategyDetail(strat)}
                            title="Bấm để xem chi tiết chiến thuật"
                            style={{ background: 'rgba(15, 23, 42, 0.8)', border: `1px solid ${themeColor}`, borderRadius: '8px', padding: '15px', cursor: 'pointer', transition: '0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 0 15px ${themeColor}40`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '15px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: themeColor, textTransform: 'uppercase' }}>
                                    {strat.type === 'skill_matchup' ? '⚔️ 50/50' : (strat.type === 'synergy' ? '🤝 COMBO' : '🛡️ PHÁ GIẢI')}
                                </span>
                                <span className="score-badge" style={{ margin: 0, padding: '2px 8px', background: `${themeColor}22`, color: themeColor }}>ĐIỂM: {strat.score || 5}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px dashed #334155' }}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {strat.teamA.map(h => <img key={h._id} src={getAvatarUrl(h.avatar)} alt={h.name} style={{ width: '35px', height: '35px', borderRadius: '50%', border: `2px solid ${themeColor}` }} title={h.name} />)}
                                </div>
                                {strat.type !== 'synergy' && strat.teamB?.length > 0 && (
                                    <>
                                        <span style={{ fontWeight: '900', color: '#64748b', fontSize: '12px' }}>{strat.type === 'skill_matchup' ? '50/50' : 'VS'}</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {strat.teamB.map(h => <img key={h._id} src={getAvatarUrl(h.avatar)} alt={h.name} style={{ width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #ef4444' }} title={h.name} />)}
                                        </div>
                                    </>
                                )}
                            </div>
                            <p style={{ fontStyle: 'italic', fontSize: '13px', color: '#cbd5e1', marginTop: '15px', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>“{strat.note}”</p>
                            <div style={{ fontSize: '11px', color: themeColor, fontWeight: 'bold' }}>Nguồn: {strat.isSystem ? '🤖 Hệ Thống' : `👤 ${strat.author?.username || 'Cộng đồng'}`}</div>
                        </div>
                    ))}
                </div>
            )
        };

        return (
            <div className="advanced-strategy-block" style={{ borderTop: `2px solid ${themeColor}`, paddingTop: '20px', marginTop: '30px' }}>
                <h3 style={{ color: themeColor, textAlign: 'center', margin: 0 }}>{title}</h3>
                {viewMode === 'compare' ? (
                    <div className="compare-split-layout" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}><h4 style={{ color: '#38bdf8', marginBottom: '10px' }}>🤖 HỆ THỐNG</h4><StrategyList data={getFilteredStrats(stratList, 'system')} /></div>
                        <div style={{ flex: 1, minWidth: '300px' }}><h4 style={{ color: '#f59e0b', marginBottom: '10px' }}>👤 CÁ NHÂN</h4><StrategyList data={getFilteredStrats(stratList, 'personal')} /></div>
                    </div>
                ) : <StrategyList data={stratList} />}
            </div>
        );
    };

    return (
        <div className="solo-counter-multi" style={{ padding: '20px 0' }}>
            <HeroModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} heroes={heroesList} onSelect={handleSelectEnemy} />

            {/* MODAL CHI TIẾT 1V1 (Khu vực 1 & 2) */}
            {selectedMatchupDetail && (
                <div className="auth-modal-overlay" onClick={closeMatchupDetail} style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="auth-modal-card" onClick={e => e.stopPropagation()} style={{ background: '#0f172a', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '550px', border: `1px solid ${selectedMatchupDetail.isThreatBox ? '#ef4444' : '#10b981'}`, position: 'relative' }}>
                        <button className="auth-modal-close" onClick={closeMatchupDetail} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        <h3 className="modal-title" style={{ color: selectedMatchupDetail.isThreatBox ? '#ef4444' : '#10b981', textAlign: 'center', marginBottom: '25px', letterSpacing: '1px', marginTop: 0 }}>
                            CHI TIẾT KÈO KHẮC CHẾ
                        </h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', marginBottom: '25px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <img src={getAvatarUrl(selectedMatchupDetail.counterHero.avatar)} style={{ width: '80px', height: '80px', borderRadius: '50%', border: `3px solid ${selectedMatchupDetail.isThreatBox ? '#ef4444' : '#10b981'}`, objectFit: 'cover', boxShadow: '0 0 15px rgba(0,0,0,0.5)' }} alt="counter" />
                                <div style={{ fontWeight: 'bold', color: '#fff', marginTop: '8px', fontSize: '15px' }}>{selectedMatchupDetail.counterHero.name}</div>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', textShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}>⚔️</div>
                            <div style={{ textAlign: 'center' }}>
                                <img src={getAvatarUrl(getHeroAvatar(selectedMatchupDetail.enemyHeroId))} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #64748b', objectFit: 'cover', opacity: 0.8 }} alt="enemy" />
                                <div style={{ fontWeight: 'bold', color: '#94a3b8', marginTop: '8px', fontSize: '15px' }}>{getHeroName(selectedMatchupDetail.enemyHeroId)}</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(30,41,59,0.8)', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
                            <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                {selectedMatchupDetail.note || 'Không có ghi chú cụ thể cho kèo đấu này.'}
                            </p>
                        </div>

                        {selectedMatchupDetail.counterItems && selectedMatchupDetail.counterItems.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ color: '#f59e0b', marginBottom: '15px', marginTop: 0 }}>🛡️ Lên trang bị để đối phó:</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {selectedMatchupDetail.counterItems.map(itemId => {
                                        const itemObj = selectedMatchupDetail.recommendedItems.find(i => i._id === itemId || i === itemId);
                                        if (!itemObj) return null;
                                        return (
                                            <div key={itemId} style={{ textAlign: 'center', background: '#0f172a', padding: '10px 8px', borderRadius: '8px', border: '1px solid #334155', width: '75px', cursor: 'pointer' }} title={itemObj.name}>
                                                <img src={getAvatarUrl(itemObj.icon, 'item')} style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} alt={itemObj.name} />
                                                <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{itemObj.name}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT CHIẾN THUẬT NÂNG CAO (Khu vực 3) */}
            {selectedStrategyDetail && (
                <div className="auth-modal-overlay" onClick={closeStrategyDetail} style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="auth-modal-card" onClick={e => e.stopPropagation()} style={{ background: '#0f172a', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '550px', border: `1px solid ${selectedStrategyDetail.type === 'synergy' ? '#10b981' : (selectedStrategyDetail.type === 'combo_counter' ? '#38bdf8' : '#f59e0b')}`, position: 'relative' }}>
                        <button className="auth-modal-close" onClick={closeStrategyDetail} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="modal-title" style={{ color: selectedStrategyDetail.type === 'synergy' ? '#10b981' : (selectedStrategyDetail.type === 'combo_counter' ? '#38bdf8' : '#f59e0b'), textAlign: 'center', marginBottom: '25px', letterSpacing: '1px', marginTop: 0 }}>
                            {selectedStrategyDetail.type === 'skill_matchup' ? '⚔️ CHI TIẾT KÈO KỸ NĂNG' : (selectedStrategyDetail.type === 'synergy' ? '🤝 CHI TIẾT COMBO ĐỒNG ĐỘI' : '🛡️ CHI TIẾT PHÁ GIẢI ĐỘI HÌNH')}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', border: '1px dashed #334155', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {selectedStrategyDetail.teamA.map(h => <img key={h._id} src={getAvatarUrl(h.avatar)} alt={h.name} style={{ width: '60px', height: '60px', borderRadius: '50%', border: `3px solid ${selectedStrategyDetail.type === 'synergy' ? '#10b981' : (selectedStrategyDetail.type === 'combo_counter' ? '#38bdf8' : '#f59e0b')}` }} title={h.name} />)}
                            </div>
                            {selectedStrategyDetail.type !== 'synergy' && selectedStrategyDetail.teamB?.length > 0 && (
                                <>
                                    <span style={{ fontWeight: '900', color: '#64748b', fontSize: '20px' }}>{selectedStrategyDetail.type === 'skill_matchup' ? '50/50' : 'VS'}</span>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {selectedStrategyDetail.teamB.map(h => <img key={h._id} src={getAvatarUrl(h.avatar)} alt={h.name} style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #ef4444' }} title={h.name} />)}
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ background: 'rgba(30,41,59,0.8)', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                                <span style={{ color: '#e2e8f0' }}><strong>Độ hiệu quả:</strong> <span className="score-badge" style={{ margin: 0, marginLeft: '8px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px' }}>{selectedStrategyDetail.score || 5} Điểm</span></span>
                                <span style={{ color: '#e2e8f0' }}><strong>Nguồn:</strong> <span style={{ color: '#f59e0b', marginLeft: '5px' }}>{selectedStrategyDetail.isSystem ? '🤖 Hệ Thống' : `👤 ${selectedStrategyDetail.author?.username || 'Cộng đồng'}`}</span></span>
                            </div>
                            
                            <h4 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '15px' }}>📝 Hướng dẫn chiến thuật:</h4>
                            <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                {selectedStrategyDetail.note || 'Không có ghi chú cụ thể cho chiến thuật này.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="global-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <ModeToggle mode={viewMode} setMode={setViewMode} />
                <button className="btn-cyber btn-add-section" onClick={addSection} style={{ padding: '12px 20px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ➕ THÊM MỤC SO SÁNH
                </button>
            </div>

            <div className="sections-list">
                {sections.map((section, index) => {
                    const skillMatchups = section.relatedStrategies.filter(s => s.type === 'skill_matchup');
                    const comboCounters = section.relatedStrategies.filter(s => s.type === 'combo_counter');
                    const enemySynergies = section.relatedStrategies.filter(s => s.type === 'synergy' && s.teamA.some(h => (h._id || h) === section.enemyHeroId));

                    return (
                        <div key={section.id} className="analysis-section-box" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #334155', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>#{index + 1}</span>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        {section.enemyHeroId ? (
                                            <div onClick={() => openHeroModal(section.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '8px 15px', borderRadius: '30px', cursor: 'pointer' }}>
                                                <img src={getAvatarUrl(getHeroAvatar(section.enemyHeroId))} alt="enemy" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ef4444' }} />
                                                <strong style={{ color: '#fff' }}>{getHeroName(section.enemyHeroId)}</strong>
                                                <span style={{ color: '#fca5a5', fontSize: '12px', marginLeft: '10px' }}>🔁 Đổi</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => openHeroModal(section.id)} style={{ background: 'transparent', border: '1px dashed #ef4444', color: '#ef4444', padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                + CHỌN TƯỚNG ĐỊCH
                                            </button>
                                        )}
                                        
                                        <button className="btn-cyber" onClick={() => handleAnalyze(section.id)} disabled={section.loading || !section.enemyHeroId} style={{ padding: '10px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: section.loading || !section.enemyHeroId ? 'not-allowed' : 'pointer', opacity: section.loading || !section.enemyHeroId ? 0.5 : 1 }}>
                                            {section.loading ? 'ĐANG QUÉT...' : '🔍 PHÂN TÍCH'}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => removeSection(section.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '24px', cursor: 'pointer' }}>×</button>
                            </div>

                            {/* BỘ LỌC CỤC BỘ (LOCAL FILTER) */}
                            {(!section.loading && (section.results.length > 0 || section.targetCounters.length > 0)) && (
                                <div className="section-local-filter" style={{ display: 'flex', gap: '10px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 15px', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap', marginBottom: '20px' }}>
                                    <input 
                                        type="text" 
                                        style={{ flex: 2, minWidth: '200px', padding: '8px 12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                                        placeholder="🔍 Nhập tên tướng muốn tìm trong mục này..." 
                                        value={section.searchTerm} 
                                        onChange={(e) => handleFilterChange(section.id, 'searchTerm', e.target.value)} 
                                    />
                                    <select 
                                        style={{ flex: 1, minWidth: '130px', padding: '8px 12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        value={section.filterLane} 
                                        onChange={(e) => handleFilterChange(section.id, 'filterLane', e.target.value)}
                                    >
                                        <option value="">🗺️ Tất cả Đường</option>
                                        {uniqueLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                                    </select>
                                    <select 
                                        style={{ flex: 1, minWidth: '130px', padding: '8px 12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                                        value={section.filterRole} 
                                        onChange={(e) => handleFilterChange(section.id, 'filterRole', e.target.value)}
                                    >
                                        <option value="">⚔️ Tất cả Vai trò</option>
                                        {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="section-results">
                                {section.loading ? (
                                    <div style={{ textAlign: 'center', color: '#38bdf8', padding: '40px' }}>ĐANG TRÍCH XUẤT DỮ LIỆU ĐA CHIỀU...</div>
                                ) : section.results.length > 0 || section.targetCounters.length > 0 || section.relatedStrategies.length > 0 ? (
                                    <>
                                        <h4 style={{ color: '#10b981', marginBottom: '15px', borderBottom: '1px solid #10b981', paddingBottom: '10px', fontSize: '16px' }}>✅ TƯỚNG KHẮC CHẾ ĐƯỢC MỤC TIÊU (NÊN CHỌN)</h4>
                                        {viewMode === 'compare' ? (
                                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
                                                <div style={{ flex: 1, minWidth: '300px' }}><h4 style={{ color: '#38bdf8', marginBottom: '15px', fontSize: '14px' }}>🤖 HỆ THỐNG</h4>{renderRecommendCards(section.results, 'system', section)}</div>
                                                <div style={{ flex: 1, minWidth: '300px' }}><h4 style={{ color: '#f59e0b', marginBottom: '15px', fontSize: '14px' }}>👤 CÁ NHÂN</h4>{renderRecommendCards(section.results, 'personal', section)}</div>
                                            </div>
                                        ) : renderRecommendCards(section.results, viewMode, section)}

                                        <h4 style={{ color: '#ef4444', marginBottom: '15px', borderBottom: '1px solid #ef4444', paddingBottom: '10px', fontSize: '16px', marginTop: '30px' }}>⚠️ MỤC TIÊU NÀY KHẮC CHẾ TƯỚNG NÀO? (NÊN TRÁNH CHỌN)</h4>
                                        {viewMode === 'compare' ? (
                                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
                                                <div style={{ flex: 1, minWidth: '300px' }}><h4 style={{ color: '#38bdf8', marginBottom: '15px', fontSize: '14px' }}>🤖 HỆ THỐNG</h4>{renderVictimCards(section.targetCounters, 'system', section)}</div>
                                                <div style={{ flex: 1, minWidth: '300px' }}><h4 style={{ color: '#f59e0b', marginBottom: '15px', fontSize: '14px' }}>👤 CÁ NHÂN</h4>{renderVictimCards(section.targetCounters, 'personal', section)}</div>
                                            </div>
                                        ) : renderVictimCards(section.targetCounters, viewMode, section)}

                                        {(skillMatchups.length > 0 || comboCounters.length > 0 || enemySynergies.length > 0) && (
                                            <div style={{ marginTop: '30px' }}>
                                                {renderAdvancedCards(skillMatchups, '⚔️ KÈO KỸ NĂNG (ĐỐI ĐẦU SÒNG PHẲNG)', '#f59e0b')}
                                                {renderAdvancedCards(comboCounters, '🛡️ CHIẾN THUẬT PHÁ GIẢI', '#38bdf8')}
                                                {renderAdvancedCards(enemySynergies, '🚨 CẢNH BÁO COMBO CỦA ĐỊCH', '#ef4444')}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '40px' }}>
                                        {section.enemyHeroId ? 'Chưa có dữ liệu cho mục tiêu này.' : 'Hãy chọn một tướng địch để bắt đầu phân tích.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SoloCounter;