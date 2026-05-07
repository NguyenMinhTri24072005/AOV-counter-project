import React, { useState, useContext } from 'react';
import HeroSelect from './HeroSelect';
import ModeToggle from './ModeToggle';
import { getCounters } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './SoloCounter.css';

const SearchSection = ({ sectionId, heroes, onRemove }) => {
    const { user } = useContext(AuthContext);
    const [selectedEnemy, setSelectedEnemy] = useState("");
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('standard');

    const handleSearch = async () => {
        if (!selectedEnemy) return;
        setIsLoading(true);
        try {
            // Truyền tham số mode và userId để Backend biết cần lấy kèo của ai
            const response = await getCounters([selectedEnemy], [], viewMode, user?.id);
            setRecommendations(response.data);
        } catch (error) {
            console.error("Lỗi tìm khắc chế:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="search-section-card">
            <ModeToggle mode={viewMode} setMode={setViewMode} />
            
            <div className="search-section-header">
                <HeroSelect
                    label="Tướng địch:"
                    heroes={heroes}
                    selectedHeroId={selectedEnemy}
                    onChange={setSelectedEnemy}
                />
                <button className="btn-remove-section" onClick={() => onRemove(sectionId)}>
                    Xóa bảng này
                </button>
            </div>

            <button
                className={`btn-search ${isLoading ? 'loading' : ''}`}
                onClick={handleSearch}
                disabled={isLoading}
            >
                {isLoading ? "Đang phân tích..." : "Tìm Tướng Khắc Chế"}
            </button>

            <div className="results-container">
                {recommendations.length > 0 ? (
                    <ul className="results-list">
                        {recommendations.map((rec) => (
                            <li key={rec.hero._id} className="result-item">
                                <strong>{rec.hero.name}</strong>
                                <span className="score">(Điểm tối ưu: {rec.totalScore})</span>
                                
                                <ul style={{ paddingLeft: '20px', marginTop: '5px', fontSize: '14px', color: '#555' }}>
                                    {rec.matchupDetails.map((detail, idx) => (
                                        <li key={idx}>
                                            "{detail.note}" 
                                            <span style={{ fontWeight: 'bold', color: detail.isSystem ? '#007bff' : '#28a745', marginLeft: '5px' }}>
                                                [{detail.isSystem ? 'Hệ thống' : detail.authorName}]
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {rec.recommendedItems.length > 0 && (
                                    <span className="item-recommendation">
                                        - Khuyên lên đồ: {rec.recommendedItems.map(item => item.name).join(', ')}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-results">Chưa có đề xuất nào cho chế độ này.</p>
                )}
            </div>
        </div>
    );
};

const SoloCounter = ({ heroes }) => {
    const [sections, setSections] = useState([{ id: Date.now() }]);

    const addSection = () => setSections([...sections, { id: Date.now() }]);
    const removeSection = (idToRemove) => setSections(sections.filter(sec => sec.id !== idToRemove));

    return (
        <div className="solo-counter-container">
            <h2 className="solo-counter-title">🔍 Tra Cứu Khắc Chế Độc Lập</h2>
            <button className="btn-add-section" onClick={addSection}>
                + Thêm lượt tra cứu
            </button>

            {sections.map(section => (
                <SearchSection
                    key={section.id}
                    sectionId={section.id}
                    heroes={heroes}
                    onRemove={removeSection}
                />
            ))}
        </div>
    );
};

export default SoloCounter;