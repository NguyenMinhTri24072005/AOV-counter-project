import React, { useState } from 'react';
import HeroSelect from './HeroSelect';
import { getCounters } from '../services/api';
import './SoloCounter.css'; // Import file CSS

const SearchSection = ({ sectionId, heroes, onRemove }) => {
    const [selectedEnemy, setSelectedEnemy] = useState("");
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!selectedEnemy) return;
        setIsLoading(true);
        try {
            const response = await getCounters([selectedEnemy]);
            setRecommendations(response.data);
        } catch (error) {
            console.error("Lỗi tìm khắc chế:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="search-section-card">
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
                                {rec.recommendedItems.length > 0 && (
                                    <span className="item-recommendation">
                                        - Lên đồ: {rec.recommendedItems.map(item => item.name).join(', ')}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-results">Chưa có đề xuất nào.</p>
                )}
            </div>
        </div>
    );
};

const SoloCounter = ({ heroes }) => {
    const [sections, setSections] = useState([{ id: Date.now() }]);

    const addSection = () => {
        setSections([...sections, { id: Date.now() }]);
    };

    const removeSection = (idToRemove) => {
        setSections(sections.filter(sec => sec.id !== idToRemove));
    };

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