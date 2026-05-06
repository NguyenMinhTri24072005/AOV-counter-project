import React, { useState } from 'react';
import ManageHeroes from './ManageHeroes';
import ManageItems from './ManageItems';
import ManageMetadata from './ManageMetadata'; // Quản lý Role & Category
import './Admin.css';

const AdminDashboard = () => {
    const [subTab, setSubTab] = useState('heroes');

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <h3>QUẢN TRỊ</h3>
                <button className={subTab === 'heroes' ? 'active' : ''} onClick={() => setSubTab('heroes')}>🦸 Quản lý Tướng</button>
                <button className={subTab === 'items' ? 'active' : ''} onClick={() => setSubTab('items')}>⚔️ Quản lý Trang bị</button>
                <button className={subTab === 'metadata' ? 'active' : ''} onClick={() => setSubTab('metadata')}>📁 Phân loại & Role</button>
            </aside>

            <main className="admin-main">
                {subTab === 'heroes' && <ManageHeroes />}
                {subTab === 'items' && <ManageItems />}
                {subTab === 'metadata' && <ManageMetadata />}
            </main>
        </div>
    );
};

export default AdminDashboard;