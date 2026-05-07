import React, { useState, useEffect, useContext } from 'react';
import { getCounters } from '../services/api';
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

    const [allEnemyCounters, setAllEnemyCounters] = useState([]);
    const [allAllyCounters, setAllAllyCounters] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const validBansEnemy = bansEnemy.filter(Boolean);
    const validBansAlly = bansAlly.filter(Boolean);
    const validPicksEnemy = picksEnemy.filter(Boolean);
    const validPicksAlly = picksAlly.filter(Boolean);

    const allExcluded = [...validBansEnemy, ...validBansAlly, ...validPicksEnemy, ...validPicksAlly];
    const availableHeroes = heroes.filter(hero => !allExcluded.includes(hero._id));

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
                    const resEnemy = await getCounters(validPicksEnemy, [], viewMode, user?.id);
                    setAllEnemyCounters(resEnemy.data);
                } else setAllEnemyCounters([]);

                if (validPicksAlly.length > 0) {
                    const resAlly = await getCounters(validPicksAlly, [], viewMode, user?.id);
                    setAllAllyCounters(resAlly.data);
                } else setAllAllyCounters([]);
            } catch (error) {
                console.error("Lỗi phân tích đội hình:", error);
            } finally {
                setIsAnalyzing(false);
            }
        };
        fetchAllRelations();
    }, [picksEnemy, picksAlly, viewMode, user]); 

    const isEnemyCounteredByAlly = (enemyId) => allEnemyCounters.some(c => validPicksAlly.includes(c.hero._id) && c.matchupDetails.some(d => d.enemyId === enemyId));
    const isAllyCounteredByEnemy = (allyId) => allAllyCounters.some(c => validPicksEnemy.includes(c.hero._id) && c.matchupDetails.some(d => d.enemyId === allyId));

    const getHeroName = (id) => heroes.find(h => h._id === id)?.name || "Unknown";
    const getHeroAvatar = (id) => heroes.find(h => h._id === id)?.avatar || "";

    const excludedFromRecommendations = [...validBansEnemy, ...validBansAlly, ...validPicksEnemy];
    const recommendedToPick = allEnemyCounters.filter(item => !excludedFromRecommendations.includes(item.hero._id));

    const excludedFromThreats = [...validBansEnemy, ...validBansAlly, ...validPicksAlly];
    const threatsToOurTeam = allAllyCounters.filter(item => !excludedFromThreats.includes(item.hero._id));

    // HÀM HỖ TRỢ: Lọc dữ liệu dùng cho Split View (So sánh chéo)
    const getFilteredCards = (cards, sourceFilter) => {
        if (!cards) return [];
        return cards.map(card => {
            const filteredDetails = card.matchupDetails.filter(d => {
                if (sourceFilter === 'system') return d.isSystem;
                if (sourceFilter === 'personal') return !d.isSystem; // Kèo của user
                return true;
            });
            return { ...card, matchupDetails: filteredDetails };
        }).filter(card => card.matchupDetails.length > 0);
    };

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

    // HÀM HIỂN THỊ DANH SÁCH CARD (Dùng chung để tránh lặp code)
    const renderCards = (cardsList, isThreatBox) => {
        if (cardsList.length === 0) return <p className="no-results" style={{ fontSize: '13px' }}>Không có dữ liệu phù hợp.</p>;
        
        return (
            <div className="recommendation-grid">
                {cardsList.map((dataObj) => {
                    // Check xem tướng này ta đã chọn (nếu là recommend) hay địch đã chọn (nếu là threat)
                    const isPicked = isThreatBox ? validPicksEnemy.includes(dataObj.hero._id) : validPicksAlly.includes(dataObj.hero._id);
                    const colorMain = isThreatBox ? '#dc3545' : '#28a745';
                    const textLabel = isThreatBox ? '(Địch Đã Chọn)' : '(Đã Chọn)';

                    return (
                        <div key={dataObj.hero._id} className="rec-card" style={{ border: isPicked ? `2px solid ${colorMain}` : '1px solid #334155', display: 'flex', gap: '15px' }}>
                            <img src={getAvatarUrl(dataObj.hero.avatar)} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="hero" />
                            <div style={{ flex: 1 }}>
                                <div className="rec-header" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                                    <strong>{dataObj.hero.name} {isPicked && <span style={{ color: colorMain, fontSize: '12px' }}>{textLabel}</span>}</strong>
                                    <span className="score-badge" style={{ background: isThreatBox ? '#ef4444' : '#f59e0b', color: isThreatBox ? '#fff' : '#000' }}>
                                        {isThreatBox ? 'NGUY HIỂM: ' : 'ĐIỂM: '}{dataObj.totalScore}
                                    </span>
                                </div>
                                <div className="rec-body" style={{ padding: '10px 0 0 0' }}>
                                    <ul className="rec-details-list">
                                        {dataObj.matchupDetails.map((detail, idx) => (
                                            <li key={idx}>
                                                Khắc chế 
                                                {/* MINI AVATAR TẠI ĐÂY */}
                                                <img src={getAvatarUrl(getHeroAvatar(detail.enemyId))} className="mini-inline-avatar" alt="enemy" title={getHeroName(detail.enemyId)} />
                                                <b style={{color: isThreatBox ? '#ef4444' : '#f59e0b'}}>{getHeroName(detail.enemyId)}</b> ({detail.score}đ)
                                                
                                                <div className="rec-note">
                                                    "{detail.note}"
                                                    <div style={{ fontSize: '11px', marginTop: '3px', color: detail.isSystem ? '#38bdf8' : '#10b981', fontWeight: 'bold' }}>
                                                        Nguồn: {detail.isSystem ? 'Hệ Thống' : detail.authorName}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="draft-mode-container">
            <ModeToggle mode={viewMode} setMode={setViewMode} />

            <HeroModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTargetAction({ type: null, index: null }); }} heroes={availableHeroes} onSelect={handleSelectHero} />

            <div className="draft-board-split" style={{ marginTop: '20px' }}>
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
                {/* BẢNG ĐỀ XUẤT */}
                <div className="analysis-board board-recommend">
                    <h2>📊 Tướng Đề Xuất Khắc Chế Địch</h2>
                    {isAnalyzing ? <p className="loading-text">Máy chủ đang phân tích...</p> : (
                        viewMode === 'compare' ? (
                            <div className="compare-split-layout">
                                <div className="compare-col system-col">
                                    <h3 className="compare-sub-title">🤖 HỆ THỐNG</h3>
                                    {renderCards(getFilteredCards(recommendedToPick, 'system'), false)}
                                </div>
                                <div className="compare-col personal-col">
                                    <h3 className="compare-sub-title">👤 CÁ NHÂN</h3>
                                    {renderCards(getFilteredCards(recommendedToPick, 'personal'), false)}
                                </div>
                            </div>
                        ) : (
                            renderCards(recommendedToPick, false)
                        )
                    )}
                </div>

                {/* BẢNG CẢNH BÁO NGUY HIỂM */}
                <div className="analysis-board board-threat">
                    <h2>⚠️ Cảnh báo: Tướng Địch khắc chế Ta</h2>
                    {isAnalyzing ? <p className="loading-text">Đang phân tích...</p> : (
                        viewMode === 'compare' ? (
                            <div className="compare-split-layout">
                                <div className="compare-col system-col">
                                    <h3 className="compare-sub-title">🤖 HỆ THỐNG</h3>
                                    {renderCards(getFilteredCards(threatsToOurTeam, 'system'), true)}
                                </div>
                                <div className="compare-col personal-col">
                                    <h3 className="compare-sub-title">👤 CÁ NHÂN</h3>
                                    {renderCards(getFilteredCards(threatsToOurTeam, 'personal'), true)}
                                </div>
                            </div>
                        ) : (
                            renderCards(threatsToOurTeam, true)
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default DraftMode;