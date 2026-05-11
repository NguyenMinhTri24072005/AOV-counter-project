import React, { useState, useEffect, useContext } from 'react';
import { getCounters, getStrategies } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ModeToggle from './ModeToggle';
import HeroModal from './HeroModal';
import './DraftMode.css';

const getAvatarUrl = (url) => {
    if (!url) return 'https://placehold.co/80x80?text=No+Image';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const DraftMode = ({ heroes }) => {
    const { user } = useContext(AuthContext);
    const [viewMode, setViewMode] = useState('standard');

    const [bansEnemy, setBansEnemy] = useState([null, null, null, null]);
    const [bansAlly, setBansAlly] = useState([null, null, null, null]);
    const [picksEnemy, setPicksEnemy] = useState([null, null, null, null, null]);
    const [picksAlly, setPicksAlly] = useState([null, null, null, null, null]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetAction, setTargetAction] = useState({ type: null, index: null });

    // STATE DỮ LIỆU
    const [allEnemyCounters, setAllEnemyCounters] = useState([]);
    const [allAllyCounters, setAllAllyCounters] = useState([]);
    const [advancedStrategies, setAdvancedStrategies] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // THÊM MỚI: STATE FILTERS & MODAL DETAIL
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLane, setFilterLane] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [selectedMatchupDetail, setSelectedMatchupDetail] = useState(null);

    // 🌟 KHẮC PHỤC LỖI: Đảm bảo heroesList luôn là một mảng
    const heroesList = Array.isArray(heroes) ? heroes : (heroes?.data || []);

    // THÊM MỚI: Lấy danh sách Lane và Role duy nhất để đưa vào Select Box
    const uniqueLanes = [...new Set(heroesList.flatMap(h => h.lane || []))];
    const uniqueRoles = [...new Set(heroesList.flatMap(h => h.roles?.map(r => r.name || r) || []))];

    const validBansEnemy = bansEnemy.filter(Boolean);
    const validBansAlly = bansAlly.filter(Boolean);
    const validPicksEnemy = picksEnemy.filter(Boolean);
    const validPicksAlly = picksAlly.filter(Boolean);

    const allExcluded = [...validBansEnemy, ...validBansAlly, ...validPicksEnemy, ...validPicksAlly];
    const availableHeroes = heroesList.filter(hero => !allExcluded.includes(hero._id));

    const openModalFor = (type, index) => {
        setTargetAction({ type, index });
        setIsModalOpen(true);
    };

    const handleSelectHero = (heroId) => {
        if (!heroId || targetAction.index === null) return;
        const { type, index } = targetAction;

        if (type === 'banEnemy') {
            const newArr = [...bansEnemy]; newArr[index] = heroId; setBansEnemy(newArr);
        } else if (type === 'banAlly') {
            const newArr = [...bansAlly]; newArr[index] = heroId; setBansAlly(newArr);
        } else if (type === 'pickEnemy') {
            const newArr = [...picksEnemy]; newArr[index] = heroId; setPicksEnemy(newArr);
        } else if (type === 'pickAlly') {
            const newArr = [...picksAlly]; newArr[index] = heroId; setPicksAlly(newArr);
        }

        setIsModalOpen(false);
        setTargetAction({ type: null, index: null });
    };

    const handleRemoveHero = (type, index, e) => {
        e.stopPropagation();
        if (type === 'banEnemy') {
            const newArr = [...bansEnemy]; newArr[index] = null; setBansEnemy(newArr);
        } else if (type === 'banAlly') {
            const newArr = [...bansAlly]; newArr[index] = null; setBansAlly(newArr);
        } else if (type === 'pickEnemy') {
            const newArr = [...picksEnemy]; newArr[index] = null; setPicksEnemy(newArr);
        } else if (type === 'pickAlly') {
            const newArr = [...picksAlly]; newArr[index] = null; setPicksAlly(newArr);
        }
    };

    useEffect(() => {
        const fetchAllRelations = async () => {
            setIsAnalyzing(true);
            try {
                if (validPicksEnemy.length > 0) {
                    const resEnemy = await getCounters(validPicksEnemy, [], viewMode, user?.id, 1, 1000);
                    setAllEnemyCounters(resEnemy.data?.data ? resEnemy.data.data : resEnemy.data || []);
                } else setAllEnemyCounters([]);

                if (validPicksAlly.length > 0) {
                    const resAlly = await getCounters(validPicksAlly, [], viewMode, user?.id, 1, 1000);
                    setAllAllyCounters(resAlly.data?.data ? resAlly.data.data : resAlly.data || []);
                } else setAllAllyCounters([]);

                const resStrats = await getStrategies(viewMode, user?.id, 1, 1000);
                setAdvancedStrategies(resStrats.data?.data ? resStrats.data.data : resStrats.data || []);

            } catch (error) {
                console.error("Lỗi phân tích đội hình:", error);
            } finally {
                setIsAnalyzing(false);
            }
        };
        fetchAllRelations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [picksEnemy, picksAlly, viewMode, user]);

    // --- LOGIC PHÂN TÍCH 1V1 ---
    const isEnemyCounteredByAlly = (enemyId) => allEnemyCounters.some(c => validPicksAlly.includes(c.hero._id) && c.matchupDetails.some(d => d.enemyId === enemyId));
    const isAllyCounteredByEnemy = (allyId) => allAllyCounters.some(c => validPicksEnemy.includes(c.hero._id) && c.matchupDetails.some(d => d.enemyId === allyId));

    const getHeroName = (id) => heroesList.find(h => h._id === id)?.name || "Unknown";
    const getHeroAvatar = (id) => heroesList.find(h => h._id === id)?.avatar || "";

    const excludedFromRecommendations = [...validBansEnemy, ...validBansAlly, ...validPicksEnemy];
    const recommendedToPick = allEnemyCounters.filter(item => !excludedFromRecommendations.includes(item.hero._id));
    const excludedFromThreats = [...validBansEnemy, ...validBansAlly, ...validPicksAlly];
    const threatsToOurTeam = allAllyCounters.filter(item => !excludedFromThreats.includes(item.hero._id));

    // ========================================================
    // --- THUẬT TOÁN CHIẾN THUẬT NÂNG CAO ---
    // ========================================================
    const skillMatchups = [];
    advancedStrategies.forEach(s => {
        if (s.type === 'skill_matchup') {
            if (s.teamB.some(h => validPicksEnemy.includes(h._id))) {
                skillMatchups.push(s);
            } else if (s.teamA.some(h => validPicksEnemy.includes(h._id))) {
                skillMatchups.push({ ...s, teamA: s.teamB, teamB: s.teamA });
            }
        }
    });

    const allySynergies = advancedStrategies.filter(s =>
        s.type === 'synergy' &&
        s.teamA.some(h => validPicksAlly.includes(h._id)) &&
        !s.teamA.every(h => validPicksAlly.includes(h._id))
    );

    const enemyCombosRaw = [];
    advancedStrategies.forEach(s => {
        if (s.type === 'synergy' && s.teamA.some(h => validPicksEnemy.includes(h._id))) {
            enemyCombosRaw.push(s);
        }

        if (s.type === 'combo_counter' && s.teamB.some(h => validPicksEnemy.includes(h._id))) {
            enemyCombosRaw.push({
                ...s,
                _id: s._id + '_auto',
                type: 'synergy',
                teamA: s.teamB,
                teamB: [],
                note: ""
            });
        }
    });

    const uniqueEnemyCombos = [];
    const seenCombos = new Set();
    enemyCombosRaw.forEach(c => {
        const comboStr = c.teamA.map(h => h._id).join(',');
        if (!seenCombos.has(comboStr)) {
            seenCombos.add(comboStr);
            uniqueEnemyCombos.push(c);
        }
    });

    const comboCounters = advancedStrategies.filter(s =>
        s.type === 'combo_counter' &&
        s.teamB.some(h => validPicksEnemy.includes(h._id))
    );

    // ========================================================
    // --- GIAO DIỆN COMPONENT ---
    // ========================================================

    const SlotBox = ({ type, id, index, highlightClass }) => {
        if (!id) return (
            <div className={`slot-box empty ${type}`} onClick={() => openModalFor(type, index)} title="Bấm để chọn tướng">
                <span className="plus-icon">+</span>
            </div>
        );
        return (
            <div className={`slot-box filled ${type} ${highlightClass || ''}`} onClick={() => openModalFor(type, index)} title="Bấm để đổi tướng">
                <div className="slot-image-container">
                    <img src={getAvatarUrl(getHeroAvatar(id))} alt="Hero" className="slot-img-bg" />
                    <div className="slot-name-overlay"><span className="hero-name">{getHeroName(id)}</span></div>
                </div>
                <button className="remove-btn" onClick={(e) => handleRemoveHero(type, index, e)}>×</button>
            </div>
        );
    };

    const getFilteredCards = (cards, sourceFilter) => {
        if (!cards) return [];
        return cards.map(card => {
            const filteredDetails = card.matchupDetails.filter(d => {
                if (sourceFilter === 'system') return d.isSystem;
                if (sourceFilter === 'personal') return !d.isSystem;
                return true;
            });
            return { ...card, matchupDetails: filteredDetails };
        }).filter(card => card.matchupDetails.length > 0);
    };

    // THÊM MỚI: HÀM LỌC (FILTER) CHO CÁC THẺ 1V1
    const applyFilters = (cards) => {
        return cards.filter(card => {
            const hero = card.hero;
            const matchName = hero.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchLane = filterLane ? hero.lane?.includes(filterLane) : true;
            const heroRoles = hero.roles?.map(r => r.name || r) || [];
            const matchRole = filterRole ? heroRoles.includes(filterRole) : true;
            return matchName && matchLane && matchRole;
        });
    };

    // THÊM MỚI: XỬ LÝ MỞ VÀ ĐÓNG MODAL CHI TIẾT
    const handleOpenMatchupDetail = (dataObj, detail, isThreatBox) => {
        setSelectedMatchupDetail({
            counterHero: dataObj.hero,
            enemyHeroId: detail.enemyId,
            score: detail.score,
            note: detail.note,
            counterItems: detail.counterItems || [],
            recommendedItems: dataObj.recommendedItems || [],
            authorName: detail.authorName,
            isSystem: detail.isSystem,
            isThreatBox
        });
    };

    const closeMatchupDetail = () => setSelectedMatchupDetail(null);

    // ĐÃ CHỈNH SỬA LẠI UI CỦA RENDERCARD (HIỂN THỊ COMPACT THAY VÌ FULL TEXT)
    const renderCards = (rawCardsList, isThreatBox) => {
        const cardsList = applyFilters(rawCardsList);
        if (cardsList.length === 0) return <p className="no-results txt-sm">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>;

        return (
            <div className="compact-recommendation-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {cardsList.map((dataObj) => {
                    const isPicked = isThreatBox ? validPicksEnemy.includes(dataObj.hero._id) : validPicksAlly.includes(dataObj.hero._id);
                    const colorClass = isThreatBox ? 'threat-color' : 'recommend-color';
                    const bgClass = isThreatBox ? 'bg-threat' : 'bg-recommend';
                    const cardBorderClass = isPicked ? `border-${isThreatBox ? 'red' : 'green'}` : '';

                    return (
                        <div key={dataObj.hero._id} className="compact-rec-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: `1px solid ${isPicked ? (isThreatBox ? '#ef4444' : '#10b981') : '#334155'}`, borderRadius: '8px', padding: '15px', transition: '0.3s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={getAvatarUrl(dataObj.hero.avatar)} alt="hero" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #38bdf8', objectFit: 'cover' }} />
                                    <div>
                                        <strong style={{ fontSize: '15px', color: '#fff' }}>{dataObj.hero.name}</strong>
                                        {isPicked && <span style={{ display: 'block', fontSize: '11px', marginTop: '2px' }} className={colorClass}>(Đã Chọn)</span>}
                                    </div>
                                </div>
                                <span className={`score-badge ${bgClass}`} style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}>{dataObj.totalScore}đ</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Khắc chế:</span>
                                {dataObj.matchupDetails.map((detail, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleOpenMatchupDetail(dataObj, detail, isThreatBox)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer', border: '1px solid #475569', transition: '0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.background = '#1e293b'; }}
                                        title="Bấm để xem chi tiết cách khắc chế"
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

    const renderAdvancedCards = (stratList, title, themeColor, isThreatBox = false) => {
        if (!stratList || stratList.length === 0) return null;

        const getFilteredStrats = (list, sourceFilter) => list.filter(s => sourceFilter === 'system' ? s.isSystem : !s.isSystem);

        const StrategyList = ({ data }) => {
            if (data.length === 0) return <p className="no-results txt-sm">Không có chiến thuật này.</p>;
            return (
                <div className="strat-advanced-grid">
                    {data.map(strat => (
                        <div key={strat._id} className="strat-advanced-card" style={{ borderLeftColor: themeColor }}>
                            <div className="adv-card-header">
                                <span className="adv-type">{strat.type === 'skill_matchup' ? '⚔️ 50/50' : (strat.type === 'synergy' ? '🤝 COMBO' : '🛡️ KHẮC CHẾ')}</span>

                                <span className={`score-badge no-margin ${isThreatBox ? 'bg-threat' : 'bg-recommend'}`}>
                                    {isThreatBox ? 'NGUY HIỂM: ' : 'ĐIỂM: '} {strat.score || 5}
                                </span>

                                <span className="adv-author">Bởi: {strat.isSystem ? 'Hệ thống' : strat.author?.username}</span>
                            </div>
                            <div className="adv-teams">
                                <div className={`mini-team-row ${isThreatBox ? 'enemy-shadow' : 'ally-shadow'}`}>
                                    {strat.teamA.map(h => (
                                        <div key={h._id} className="strat-hero-icon-wrap">
                                            <img src={getAvatarUrl(h.avatar)} title={h.name} alt={h.name} />
                                            <span className="strat-hero-name">{h.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {strat.type !== 'synergy' && strat.teamB?.length > 0 && (
                                    <>
                                        <div className="adv-vs">{strat.type === 'skill_matchup' ? '50/50' : 'VS'}</div>
                                        <div className={`mini-team-row ${isThreatBox ? 'ally-shadow' : 'enemy-shadow'}`}>
                                            {strat.teamB.map(h => (
                                                <div key={h._id} className="strat-hero-icon-wrap">
                                                    <img src={getAvatarUrl(h.avatar)} title={h.name} alt={h.name} />
                                                    <span className="strat-hero-name">{h.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
        };

        return (
            <div className="advanced-strategy-block" style={{ borderTop: `2px solid ${themeColor}` }}>
                <h3 className="advanced-block-title" style={{ color: themeColor }}>{title}</h3>

                {viewMode === 'compare' ? (
                    <div className="compare-split-layout">
                        <div className="compare-col system-col">
                            <h4 className="compare-sub-title">🤖 HỆ THỐNG</h4>
                            <StrategyList data={getFilteredStrats(stratList, 'system')} />
                        </div>
                        <div className="compare-col personal-col">
                            <h4 className="compare-sub-title">👤 CÁ NHÂN</h4>
                            <StrategyList data={getFilteredStrats(stratList, 'personal')} />
                        </div>
                    </div>
                ) : (
                    <StrategyList data={stratList} />
                )}
            </div>
        );
    };

    return (
        <div className="draft-mode-container">
            <ModeToggle mode={viewMode} setMode={setViewMode} />

            <HeroModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTargetAction({ type: null, index: null }); }} heroes={availableHeroes} onSelect={handleSelectHero} />

            {/* THÊM MỚI: GIAO DIỆN MODAL HIỂN THỊ CHI TIẾT */}
            {selectedMatchupDetail && (
                <div className="auth-modal-overlay" onClick={closeMatchupDetail} style={{ zIndex: 99999 }}>
                    <div className="auth-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', border: `1px solid ${selectedMatchupDetail.isThreatBox ? '#ef4444' : '#10b981'}` }}>
                        <button className="auth-modal-close" onClick={closeMatchupDetail}>×</button>
                        <h3 className="modal-title" style={{ color: selectedMatchupDetail.isThreatBox ? '#ef4444' : '#10b981', textAlign: 'center', marginBottom: '25px', letterSpacing: '1px' }}>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                                <span><strong>Mức độ hiệu quả:</strong> <span className={`score-badge ${selectedMatchupDetail.isThreatBox ? 'bg-threat' : 'bg-recommend'}`} style={{ margin: 0, marginLeft: '8px' }}>{selectedMatchupDetail.score} Điểm</span></span>
                                <span><strong>Nguồn:</strong> <span style={{ color: '#38bdf8', marginLeft: '5px' }}>{selectedMatchupDetail.isSystem ? '🤖 Hệ Thống' : `👤 ${selectedMatchupDetail.authorName}`}</span></span>
                            </div>
                            
                            <h4 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '15px' }}>📝 Lý do phân tích:</h4>
                            <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                {selectedMatchupDetail.note || 'Không có ghi chú cụ thể cho kèo đấu này.'}
                            </p>
                        </div>

                        {selectedMatchupDetail.counterItems && selectedMatchupDetail.counterItems.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ color: '#f59e0b', marginBottom: '15px' }}>🛡️ Lên trang bị để đối phó:</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {selectedMatchupDetail.counterItems.map(itemId => {
                                        const itemObj = selectedMatchupDetail.recommendedItems.find(i => i._id === itemId || i === itemId);
                                        if (!itemObj) return null;
                                        return (
                                            <div key={itemId} style={{ textAlign: 'center', background: '#0f172a', padding: '10px 8px', borderRadius: '8px', border: '1px solid #334155', width: '75px', transition: '0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'} title={itemObj.name}>
                                                <img src={getAvatarUrl(itemObj.icon)} style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} alt={itemObj.name} />
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

            <div className="draft-board-split mt-20">
                <div className="team-col ally-col">
                    <h2 className="col-title ally-title">🛡️ ĐỘI TA</h2>
                    <div className="bans-row">
                        <h4>Tướng Cấm (4)</h4>
                        <div className="slots-container bans">
                            {[0, 1, 2, 3].map(i => <SlotBox key={`ab-${i}`} type="banAlly" id={bansAlly[i]} index={i} />)}
                        </div>
                    </div>
                    <div className="picks-row">
                        <h4>Tướng Chọn (5)</h4>
                        <div className="slots-container picks">
                            {[0, 1, 2, 3, 4].map(i => {
                                const aId = picksAlly[i];
                                const highlight = aId && isAllyCounteredByEnemy(aId) ? 'border-red' : '';
                                return <SlotBox key={`ap-${i}`} type="pickAlly" id={aId} index={i} highlightClass={highlight} />;
                            })}
                        </div>
                    </div>
                </div>

                <div className="team-col enemy-col">
                    <h2 className="col-title enemy-title">⚔️ ĐỘI ĐỊCH</h2>
                    <div className="bans-row">
                        <h4>Tướng Cấm (4)</h4>
                        <div className="slots-container bans">
                            {[0, 1, 2, 3].map(i => <SlotBox key={`eb-${i}`} type="banEnemy" id={bansEnemy[i]} index={i} />)}
                        </div>
                    </div>
                    <div className="picks-row">
                        <h4>Tướng Chọn (5)</h4>
                        <div className="slots-container picks">
                            {[0, 1, 2, 3, 4].map(i => {
                                const eId = picksEnemy[i];
                                const highlight = eId && isEnemyCounteredByAlly(eId) ? 'border-green' : '';
                                return <SlotBox key={`ep-${i}`} type="pickEnemy" id={eId} index={i} highlightClass={highlight} />
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="analysis-container">
                {isAnalyzing && <p className="loading-text text-center-full">Máy chủ đang phân tích...</p>}

                {/* THÊM MỚI: THANH LỌC TÌM KIẾM CHIẾN THUẬT */}
                <div className="filter-bar-strat" style={{ display: 'flex', gap: '15px', background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid #334155', flexWrap: 'wrap', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <input 
                        type="text" 
                        style={{ flex: 2, minWidth: '250px', padding: '12px 15px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                        placeholder="🔍 Nhập tên tướng bạn muốn tìm..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                    <select 
                        style={{ flex: 1, minWidth: '150px', padding: '12px 15px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                        value={filterLane} 
                        onChange={(e) => setFilterLane(e.target.value)}
                    >
                        <option value="">🗺️ Lọc theo Đường</option>
                        {uniqueLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                    </select>
                    <select 
                        style={{ flex: 1, minWidth: '150px', padding: '12px 15px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                        value={filterRole} 
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="">⚔️ Lọc theo Vai trò</option>
                        {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>

                {/* KHU VỰC 1: ĐỀ XUẤT 1V1 VÀ COMBO PHÁ GIẢI (MÀU XANH) */}
                <div className="analysis-board board-recommend">
                    <h2>📊 GỢI Ý CHIẾN THUẬT CHO ĐỘI TA</h2>

                    <div className="sub-board">
                        <h3 className="sub-board-title">Khắc chế 1v1</h3>
                        {viewMode === 'compare' ? (
                            <div className="compare-split-layout">
                                <div className="compare-col system-col">
                                    <h4 className="compare-sub-title">🤖 HỆ THỐNG</h4>
                                    {renderCards(getFilteredCards(recommendedToPick, 'system'), false)}
                                </div>
                                <div className="compare-col personal-col">
                                    <h4 className="compare-sub-title">👤 CÁ NHÂN</h4>
                                    {renderCards(getFilteredCards(recommendedToPick, 'personal'), false)}
                                </div>
                            </div>
                        ) : (
                            renderCards(recommendedToPick, false)
                        )}
                    </div>

                    {renderAdvancedCards(skillMatchups, '⚔️ KÈO KỸ NĂNG (ĐỐI ĐẦU SÒNG PHẲNG)', '#f59e0b', false)}
                    {renderAdvancedCards(allySynergies, '🤝 GỢI Ý PHỐI HỢP ĐỒNG ĐỘI (COMBO)', '#10b981', false)}
                    {renderAdvancedCards(comboCounters, '🛡️ PHÁ GIẢI ĐỘI HÌNH ĐỊCH', '#38bdf8', false)}
                </div>

                {/* KHU VỰC 2: CẢNH BÁO NGUY HIỂM TỪ ĐỊCH (MÀU ĐỎ) */}
                <div className="analysis-board board-threat">
                    <h2>⚠️ PHÂN TÍCH MỐI ĐE DỌA TỪ ĐỊCH</h2>

                    <div className="sub-board">
                        <h3 className="sub-board-title">Tướng Địch khắc chế Ta (1v1)</h3>
                        {viewMode === 'compare' ? (
                            <div className="compare-split-layout">
                                <div className="compare-col system-col">
                                    <h4 className="compare-sub-title">🤖 HỆ THỐNG</h4>
                                    {renderCards(getFilteredCards(threatsToOurTeam, 'system'), true)}
                                </div>
                                <div className="compare-col personal-col">
                                    <h4 className="compare-sub-title">👤 CÁ NHÂN</h4>
                                    {renderCards(getFilteredCards(threatsToOurTeam, 'personal'), true)}
                                </div>
                            </div>
                        ) : (
                            renderCards(threatsToOurTeam, true)
                        )}
                    </div>

                    {renderAdvancedCards(uniqueEnemyCombos, '🚨 BÁO ĐỘNG: ĐỊCH ĐANG XÂY DỰNG COMBO', '#ef4444', true)}
                </div>
            </div>
        </div>
    );
};

export default DraftMode;