import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SoloCounter from './components/SoloCounter';
import DraftMode from './components/DraftMode';
import { getHeroes } from './services/api';
import './App.css';

import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import UserDashboard from './pages/User/UserDashboard';

const HomeTabs = ({ heroes }) => {
    const [activeTab, setActiveTab] = useState('draft');
    return (
        <div>
            <div className="tabs-container">
                <button className={`tab-button ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>
                    ⚔️ Bàn Cờ Cấm Chọn
                </button>
                <button className={`tab-button ${activeTab === 'solo' ? 'active' : ''}`} onClick={() => setActiveTab('solo')}>
                    🔍 Khắc Chế Cá Nhân
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'solo' && <SoloCounter heroes={heroes} />}
                {activeTab === 'draft' && <DraftMode heroes={heroes} />}
            </div>
        </div>
    );
};

function App() {
    const { user, logout } = useContext(AuthContext);
    const [heroes, setHeroes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                const response = await getHeroes();
                setHeroes(response.data);
            } catch (error) {
                console.error("Lỗi tải tướng:", error);
            }
        };
        fetchHeroes();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            {/* NAV BAR ESPORT STYLE */}
            <header className="app-header-nav">
                <Link to="/" className="logo-link" >
                    <h1 className="cyber-logo">AOV <span>COUNTER</span></h1>
                </Link>
                
                <div className="user-controls">
                    {user ? (
                        <div className="user-info-box">
                            <span className="user-greeting">
                                Xin chào, <strong className="highlight-text">{user.username}</strong>
                            </span>
                            
                            <button className="btn-cyber btn-user" onClick={() => navigate('/profile')}>
                                👤 Cá nhân
                            </button>

                            {user.role === 'admin' && (
                                <button className="btn-cyber btn-admin" onClick={() => navigate('/admin')}>
                                    👑 Hệ Thống
                                </button>
                            )}

                            <button className="btn-cyber btn-logout" onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login"><button className="btn-cyber btn-login">Đăng Nhập</button></Link>
                            <Link to="/register"><button className="btn-cyber btn-register">Đăng Ký</button></Link>
                        </div>
                    )}
                </div>
            </header>

            <Routes>
                <Route path="/" element={<HomeTabs heroes={heroes} />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={user ? <UserDashboard /> : <Navigate to="/login" replace />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Routes>
        </div>
    );
}

export default App;