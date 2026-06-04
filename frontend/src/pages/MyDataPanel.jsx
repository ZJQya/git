import React, { useState, useRef } from 'react';
import { Upload, Button, Card, List, message, Drawer, Table, Space ,Popconfirm} from 'antd';
import { UploadOutlined, FileTextOutlined, EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { uploadDataset } from '../services/api';
import { deleteDataset } from '../services/api';


const MyDataPanel = ({ datasetList, fileList, onDatasetUploaded ,onDatasetDeleted }) => {
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [previewColumns, setPreviewColumns] = useState([]);
    const [currentFileName, setCurrentFileName] = useState('');
    const fileObjectMap = useRef({});  // 缓存 File 对象用于预览

    const handleUpload = async (file) => {
        try {
            const res = await uploadDataset(file);
            const newFile = {
                id: res.data.id,
                name: file.name,
            };
            // 缓存 File 对象，以便预览
            fileObjectMap.current[res.data.id] = file;
            // 通知父组件更新列表（仅一次）
            onDatasetUploaded(newFile);
            message.success(`${file.name} 上传成功`);
        } catch {
            message.error(`${file.name} 上传失败`);
        }
        return false;
    };

    const handleDelete = async (id) => {
        try {
            await deleteDataset(id);
            message.success('文件已删除');
            if (fileObjectMap.current[id]) {
                delete fileObjectMap.current[id];
            }
            onDatasetDeleted(id);   // 调用父组件更新列表
        } catch {
            message.error('删除失败');
        }
    };

    const handlePreview = (fileItem) => {
        const file = fileObjectMap.current[fileItem.id];
        if (!file) {
            message.warning('文件数据已过期，请重新上传后再预览');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                message.warning('文件内容为空或格式不正确');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];
            for (let i = 1; i < Math.min(lines.length, 101); i++) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || ''; });
                data.push(row);
            }
            setPreviewColumns(headers.map(h => ({ title: h, dataIndex: h, ellipsis: true })));
            setPreviewData(data);
            setCurrentFileName(fileItem.name);
            setPreviewVisible(true);
        };
        reader.readAsText(file);
    };

    const closePreview = () => {
        setPreviewVisible(false);
        setPreviewData([]);
        setPreviewColumns([]);
    };

    return (
        <Card title="我的数据" style={{ marginBottom: 24 }}>
            <Upload accept=".csv" showUploadList={false} beforeUpload={handleUpload}>
                <Button type="primary" icon={<UploadOutlined />}>上传 CSV 文件</Button>
            </Upload>

            <Card title="已上传文件" style={{ marginTop: 16 }}>
                <List
                    dataSource={fileList}
                    locale={{ emptyText: '暂无文件，请点击上方按钮上传' }}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(item)}>查看数据</Button>,
                                <Popconfirm
                                    title="确定删除此文件吗？"
                                    description="删除后无法恢复，相关分析结果可能失效。"
                                    onConfirm={() => handleDelete(item.id)}
                                    okText="确定"
                                    cancelText="取消"
                                >
                                    <Button type="link" danger>删除</Button>
                                </Popconfirm>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<FileTextOutlined style={{ fontSize: 24 }} />}
                                title={item.name}
                                description={`ID: ${item.id}`}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Drawer
                title={
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={closePreview} type="text" />
                        <span>数据预览：{currentFileName}</span>
                    </Space>
                }
                width="80%"
                open={previewVisible}
                onClose={closePreview}
                extra={<Button onClick={closePreview} icon={<ArrowLeftOutlined />}>返回</Button>}
            >
                <Table
                    dataSource={previewData}
                    columns={previewColumns}
                    scroll={{ x: true, y: 'calc(100vh - 200px)' }}
                    rowKey={(_, idx) => idx}
                    size="small"
                />
            </Drawer>
        </Card>
    );
};

export default MyDataPanel;