import React, { useState, useEffect } from 'react';
import {
    Layout, Menu, Dropdown, Avatar, Space, Typography, Tag, message
} from 'antd';
import {
    UserOutlined, FolderOpenOutlined, BarChartOutlined,
    LogoutOutlined, CrownOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getVipStatus, activateVip } from '../services/api';
import MyDataPanel from './MyDataPanel';
import AnalysisPanel from './AnalysisPanel';

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

const Dashboard = ({ onLogout }) => {
    const [datasetList, setDatasetList] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState('my_data'); // 默认显示“我的数据”
    const [username, setUsername] = useState('');
    const [vip, setVip] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.sub || '用户');
            } catch { }
        }
        fetchVipStatus();
    }, []);

    const fetchVipStatus = async () => {
        try {
            const res = await getVipStatus();
            setVip(res.data.vip);
        } catch { }
    };

    const handleActivateVip = async () => {
        try {
            await activateVip();
            message.success('VIP 已开通（30天）');
            fetchVipStatus();
        } catch {
            message.error('开通失败');
        }
    };

    const handleLogout = () => onLogout();

    const userMenuItems = [
        {
            key: 'info',
            label: (
                <div>
                    <Text strong>{username}</Text>
                    <br />
                    VIP：{vip ? <Tag color="gold">已开通</Tag> : <Tag color="default">未开通</Tag>}
                </div>
            ),
            disabled: true,
        },
        { type: 'divider' },
        { key: 'vip', icon: <CrownOutlined />, label: '开通 VIP', onClick: handleActivateVip },
        { key: 'history', icon: <HistoryOutlined />, label: '历史记录', onClick: () => navigate('/history') },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ];

    // 添加新数据集到列表
    const handleDatasetUploaded = (ds) => {
        setDatasetList(prev => [...prev, ds]);
    };

    // 根据选择的菜单渲染不同内容
    const renderContent = () => {
        if (selectedMenu === 'my_data') {
            return <MyDataPanel datasetList={datasetList} onDatasetUploaded={handleDatasetUploaded} />;
        }
        // 三个分析算法对应不同的 taskType
        const taskTypeMap = {
            'decision_tree': 'decision_tree',
            'kmeans': 'kmeans',
            'apriori': 'apriori',
        };
        return <AnalysisPanel datasetList={datasetList} taskType={taskTypeMap[selectedMenu] || 'decision_tree'} />;
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* 顶部用户栏 */}
            <Header style={{
                background: '#fff', padding: '0 24px', display: 'flex',
                justifyContent: 'flex-end', alignItems: 'center',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                    <Space style={{ cursor: 'pointer' }}>
                        <Avatar icon={<UserOutlined />} />
                        <span>{username}</span>
                    </Space>
                </Dropdown>
            </Header>

            <Layout>
                <Sider width={250} theme="light">
                    <div style={{ padding: 16, fontWeight: 'bold', fontSize: 18 }}>数据挖掘工具</div>
                    <Menu mode="inline" selectedKeys={[selectedMenu]} onClick={({ key }) => setSelectedMenu(key)}>
                        <Menu.Item key="my_data" icon={<FolderOpenOutlined />}>我的数据</Menu.Item>
                        <Menu.SubMenu key="analysis" icon={<BarChartOutlined />} title="数据分析">
                            <Menu.Item key="decision_tree">决策树</Menu.Item>
                            <Menu.Item key="kmeans">K-Means 聚类</Menu.Item>
                            <Menu.Item key="apriori">关联规则</Menu.Item>
                        </Menu.SubMenu>
                    </Menu>
                </Sider>
                <Content style={{ padding: 24, background: '#fff' }}>
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard;