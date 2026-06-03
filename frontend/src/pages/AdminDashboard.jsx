import React, { useState, useEffect } from 'react';
import {
    Layout, Menu, Button, Card, Table, message, Statistic, Row, Col,
    Dropdown, Avatar, Space, Typography, Tag
} from 'antd';
import {
    UserOutlined, BarChartOutlined, LogoutOutlined, DashboardOutlined
} from '@ant-design/icons';
import { getUsers, deleteUser, getAllAnalysis, getResultImageUrl } from '../services/api';
import { jwtDecode } from 'jwt-decode';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const AdminDashboard = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [analysis, setAnalysis] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState('dashboard');
    const [username, setUsername] = useState('');

    // 解析 token 获取用户名
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.sub || '管理员');
            } catch (e) {
                console.error('Token解析失败', e);
            }
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchAllAnalysis();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await getUsers();
            setUsers(res.data);
        } catch { message.error('获取用户列表失败'); }
    };

    const fetchAllAnalysis = async () => {
        try {
            const res = await getAllAnalysis();
            setAnalysis(res.data);
        } catch { message.error('获取分析记录失败'); }
    };

    const handleDeleteUser = (id) => {
        deleteUser(id).then(() => {
            message.success('用户已删除');
            setUsers(users.filter(u => u.id !== id));
        }).catch(() => message.error('删除失败'));
    };

    const totalUsers = users.length;
    const totalAnalysis = analysis.length;
    const successAnalysis = analysis.filter(a => a.status === 'SUCCESS').length;
    const vipUsers = users.filter(u => u.vip).length;

    // 用户下拉菜单
    const userMenuItems = [
        {
            key: 'info',
            label: (
                <div style={{ padding: '4px 0' }}>
                    <div><Text strong>{username}</Text></div>
                    <div>
                        角色：<Tag color="blue">管理员</Tag>
                    </div>
                </div>
            ),
            disabled: true,
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: () => onLogout(),
        },
    ];

    const userColumns = [
        { title: 'ID', dataIndex: 'id' },
        { title: '用户名', dataIndex: 'username' },
        { title: '角色', dataIndex: 'role' },
        { title: 'VIP', dataIndex: 'vip', render: v => v ? '是' : '否' },
        {
            title: '操作',
            render: (_, record) => (
                <Button danger size="small"
                        disabled={record.role === 'ADMIN'}
                        onClick={() => handleDeleteUser(record.id)}>
                    删除
                </Button>
            )
        }
    ];

    const analysisColumns = [
        { title: '任务ID', dataIndex: 'id' },
        {
            title: '用户名',
            render: (_, record) => {
                const user = users.find(u => u.id === record.userId);
                return user ? user.username : `未知用户(${record.userId})`;
            }
        },
        { title: '类型', dataIndex: 'taskType' },
        { title: '状态', dataIndex: 'status',
            render: (status) => (
                <span style={{ color: status === 'SUCCESS' ? '#52c41a' : '#ff4d4f' }}>{status}</span>
            )
        },
        {
            title: '提交时间',
            dataIndex: 'createTime',
            render: (text) => text || '-'
        },
        {
            title: '结果',
            render: (_, record) => (
                <a href={getResultImageUrl(record.id)} target="_blank" rel="noreferrer">查看图片</a>
            )
        }
    ];

    const renderContent = () => {
        switch (selectedMenu) {
            case 'dashboard':
                return (
                    <>
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={6}><Card><Statistic title="总用户数" value={totalUsers} prefix={<UserOutlined />} /></Card></Col>
                            <Col span={6}><Card><Statistic title="VIP 用户" value={vipUsers} valueStyle={{ color: '#cf9d1f' }} /></Card></Col>
                            <Col span={6}><Card><Statistic title="总分析任务" value={totalAnalysis} prefix={<BarChartOutlined />} /></Card></Col>
                            <Col span={6}><Card><Statistic title="成功任务" value={successAnalysis} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                        </Row>
                        <Card title="最近分析任务">
                            <Table dataSource={analysis.slice(0, 5)} columns={analysisColumns} rowKey="id" pagination={false} />
                        </Card>
                    </>
                );
            case 'users':
                return (
                    <Card title="用户管理">
                        <Table dataSource={users} columns={userColumns} rowKey="id" />
                    </Card>
                );
            case 'analysis':
                return (
                    <Card title="所有分析记录">
                        <Table dataSource={analysis} columns={analysisColumns} rowKey="id" />
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* 顶部导航栏 */}
            <Header style={{
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
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
                <Sider width={250} theme="dark" collapsible>
                    <div style={{ padding: 24, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                        ⚙️ 管理员控制台
                    </div>
                    <Menu theme="dark" mode="inline" selectedKeys={[selectedMenu]} onClick={({ key }) => setSelectedMenu(key)}>
                        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>数据总览</Menu.Item>
                        <Menu.Item key="users" icon={<UserOutlined />}>用户管理</Menu.Item>
                        <Menu.Item key="analysis" icon={<BarChartOutlined />}>分析记录</Menu.Item>
                    </Menu>
                </Sider>
                <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;