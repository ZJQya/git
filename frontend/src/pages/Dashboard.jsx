import React, { useState, useEffect } from 'react';
import {
    Layout, Menu, Button, Upload, message, Card, Select, Radio,
    Image, Form, InputNumber, Dropdown, Avatar, Space, Typography, Tag
} from 'antd';
import {
    UploadOutlined, InboxOutlined, LogoutOutlined,
    UserOutlined, CrownOutlined, HistoryOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
    uploadDataset, submitAnalysis, getTaskStatus, getResultImageUrl,
    activateVip, getUserHistory, getVipStatus
} from '../services/api';

const { Content, Sider, Header } = Layout;
const { Dragger } = Upload;
const { Text } = Typography;

const Dashboard = ({ onLogout }) => {
    const [datasetList, setDatasetList] = useState([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState(null);
    const [taskType, setTaskType] = useState('decision_tree');
    const [taskId, setTaskId] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState({});

    // 用户信息
    const [username, setUsername] = useState('');
    const [vip, setVip] = useState(false);
    const navigate = useNavigate();

    // 初始化用户信息
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.sub || '用户');
            } catch (e) {
                console.error('解析token失败', e);
            }
        }
        fetchVipStatus();
    }, []);

    // 获取VIP状态
    const fetchVipStatus = async () => {
        try {
            const res = await getVipStatus();
            setVip(res.data.vip);
        } catch {
            // 忽略错误
        }
    };

    // 开通VIP
    const handleActivateVip = async () => {
        try {
            await activateVip();
            message.success('VIP 已开通（30天有效期）');
            fetchVipStatus(); // 刷新状态
        } catch {
            message.error('开通VIP失败');
        }
    };

    // 退出登录
    const handleLogout = () => {
        onLogout();
    };

    // 用户下拉菜单
    const userMenuItems = [
        {
            key: 'info',
            label: (
                <div style={{ padding: '4px 0' }}>
                    <div><Text strong>{username}</Text></div>
                    <div>
                        VIP 状态：
                        {vip ? (
                            <Tag color="gold">已开通</Tag>
                        ) : (
                            <Tag color="default">未开通</Tag>
                        )}
                    </div>
                </div>
            ),
            disabled: true,
        },
        { type: 'divider' },
        {
            key: 'activateVip',
            icon: <CrownOutlined />,
            label: '开通 VIP',
            onClick: handleActivateVip,
        },
        {
            key: 'history',
            icon: <HistoryOutlined />,
            label: '查看历史记录',
            onClick: () => navigate('/history'),
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout,
        },
    ];

    // 上传数据集
    const handleUpload = async (file) => {
        setLoading(true);
        try {
            const res = await uploadDataset(file);
            message.success('上传成功');
            setSelectedDatasetId(res.data.id);
            setDatasetList([...datasetList, { id: res.data.id, name: file.name }]);
        } catch {
            message.error('上传失败');
        } finally {
            setLoading(false);
        }
        return false;
    };

    // 开始分析
    const startAnalysis = async () => {
        if (!selectedDatasetId) {
            message.warning('请先选择数据集');
            return;
        }
        setLoading(true);
        try {
            const res = await submitAnalysis(selectedDatasetId, taskType, JSON.stringify(params));
            const taskIdRes = res.data.id;
            setTaskId(taskIdRes);
            pollTaskStatus(taskIdRes);
        } catch {
            message.error('提交分析任务失败');
            setLoading(false);
        }
    };

    const pollTaskStatus = (id) => {
        const timer = setInterval(async () => {
            try {
                const res = await getTaskStatus(id);
                if (res.data.status === 'SUCCESS') {
                    clearInterval(timer);
                    setLoading(false);
                    setResultImage(getResultImageUrl(id));
                    message.success('分析完成');
                } else if (res.data.status === 'FAILED') {
                    clearInterval(timer);
                    setLoading(false);
                    message.error('分析失败');
                }
            } catch {
                clearInterval(timer);
                setLoading(false);
            }
        }, 2000);
    };

    const handleTaskTypeChange = (e) => {
        setTaskType(e.target.value);
        setParams({});
    };

    const renderParamForm = () => {
        switch (taskType) {
            case 'decision_tree':
                return (
                    <>
                        <Form.Item label="最大深度 (max_depth)">
                            <InputNumber
                                min={1} max={20}
                                value={params.max_depth || 5}
                                onChange={(v) => setParams({ ...params, max_depth: v })}
                            />
                        </Form.Item>
                        <Form.Item label="测试集比例 (test_size)">
                            <InputNumber
                                min={0.1} max={0.5} step={0.1}
                                value={params.test_size || 0.2}
                                onChange={(v) => setParams({ ...params, test_size: v })}
                            />
                        </Form.Item>
                    </>
                );
            case 'kmeans':
                return (
                    <Form.Item label="聚类数 (n_clusters)">
                        <InputNumber
                            min={2} max={10}
                            value={params.n_clusters || 3}
                            onChange={(v) => setParams({ ...params, n_clusters: v })}
                        />
                    </Form.Item>
                );
            case 'apriori':
                return (
                    <>
                        <Form.Item label="最小支持度 (min_support)">
                            <InputNumber
                                min={0.01} max={1} step={0.01}
                                value={params.min_support || 0.2}
                                onChange={(v) => setParams({ ...params, min_support: v })}
                            />
                        </Form.Item>
                        <Form.Item label="最小提升度 (min_threshold)">
                            <InputNumber
                                min={0.1} max={10} step={0.1}
                                value={params.min_threshold || 0.6}
                                onChange={(v) => setParams({ ...params, min_threshold: v })}
                            />
                        </Form.Item>
                    </>
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
                <Sider width={250} theme="light">
                    <div style={{ padding: 16, fontWeight: 'bold', fontSize: 18 }}>数据挖掘工具</div>
                    <Menu mode="inline" defaultSelectedKeys={['upload']}>
                        <Menu.Item key="upload">数据集管理</Menu.Item>
                    </Menu>
                    {/* 移除原来的VIP按钮和历史记录链接 */}
                </Sider>

                <Content style={{ padding: 24, background: '#fff' }}>
                    <Card title="上传数据集">
                        <Dragger name="file" multiple={false} beforeUpload={handleUpload} showUploadList={false}>
                            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                            <p>点击或拖拽CSV文件到此区域上传</p>
                        </Dragger>
                    </Card>

                    {datasetList.length > 0 && (
                        <Card title="选择数据集">
                            <Select
                                style={{ width: '100%' }}
                                placeholder="选择数据集"
                                value={selectedDatasetId}
                                onChange={setSelectedDatasetId}
                            >
                                {datasetList.map(ds => (
                                    <Select.Option key={ds.id} value={ds.id}>{ds.name}</Select.Option>
                                ))}
                            </Select>
                        </Card>
                    )}

                    <Card title="分析方法">
                        <Radio.Group value={taskType} onChange={handleTaskTypeChange}>
                            <Radio.Button value="decision_tree">决策树</Radio.Button>
                            <Radio.Button value="kmeans">K-Means聚类</Radio.Button>
                            <Radio.Button value="apriori">关联规则</Radio.Button>
                        </Radio.Group>
                        <div style={{ marginTop: 16 }}>{renderParamForm()}</div>
                        <Button type="primary" onClick={startAnalysis} loading={loading} style={{ marginTop: 16 }}>
                            开始分析
                        </Button>
                    </Card>

                    {resultImage && (
                        <Card title="分析结果">
                            <Image src={resultImage} style={{ maxWidth: '100%' }} />
                            <div style={{ marginTop: 16 }}>
                                <Button icon={<UploadOutlined />} onClick={() => window.open(resultImage)}>
                                    下载图片
                                </Button>
                            </div>
                        </Card>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard;