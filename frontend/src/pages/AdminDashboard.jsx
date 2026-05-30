import React, { useState, useEffect } from 'react';
import {
    Layout, Menu, Button, Card, Table, message, Space
} from 'antd';
import { getUsers, deleteUser, getAllAnalysis, getResultImageUrl } from '../services/api';

const { Sider, Content } = Layout;

const AdminDashboard = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [analysis, setAnalysis] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchAllAnalysis();
    }, []);

    const fetchUsers = () => {
        getUsers()
            .then(res => setUsers(res.data))
            .catch(() => message.error('获取用户列表失败'));
    };

    const fetchAllAnalysis = () => {
        getAllAnalysis()
            .then(res => setAnalysis(res.data))
            .catch(() => message.error('获取分析记录失败'));
    };

    const handleDeleteUser = (id) => {
        deleteUser(id)
            .then(() => {
                message.success('用户已删除');
                setUsers(users.filter(u => u.id !== id));
            })
            .catch(() => message.error('删除失败'));
    };

    const userColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: '用户名', dataIndex: 'username', key: 'username' },
        { title: '角色', dataIndex: 'role', key: 'role' },
        {
            title: 'VIP',
            dataIndex: 'vip',
            key: 'vip',
            render: (vip) => vip ? '是' : '否'
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Button
                    danger
                    onClick={() => handleDeleteUser(record.id)}
                    disabled={record.role === 'ADMIN'} // 不能删除管理员
                >
                    删除
                </Button>
            )
        }
    ];

    const analysisColumns = [
        { title: '任务ID', dataIndex: 'id', key: 'id' },
        { title: '用户ID', dataIndex: 'userId', key: 'userId' },
        { title: '分析类型', dataIndex: 'taskType', key: 'taskType' },
        { title: '状态', dataIndex: 'status', key: 'status' },
        {
            title: '结果',
            key: 'result',
            render: (_, record) => (
                <a href={getResultImageUrl(record.id)} target="_blank" rel="noreferrer">查看图片</a>
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="light">
                <div style={{ padding: 16, fontWeight: 'bold', fontSize: 18 }}>管理员面板</div>
                <Menu mode="inline" defaultSelectedKeys={['users']}>
                    <Menu.Item key="users">用户管理</Menu.Item>
                    <Menu.Item key="analysis">分析记录</Menu.Item>
                </Menu>
                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center' }}>
                    <Button onClick={onLogout} block>退出登录</Button>
                </div>
            </Sider>
            <Layout>
                <Content style={{ padding: 24, background: '#fff' }}>
                    <Card title="用户管理" style={{ marginBottom: 24 }}>
                        <Table
                            dataSource={users}
                            columns={userColumns}
                            rowKey="id"
                        />
                    </Card>
                    <Card title="所有分析记录">
                        <Table
                            dataSource={analysis}
                            columns={analysisColumns}
                            rowKey="id"
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;