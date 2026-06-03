import React, { useState, useEffect } from 'react';
import { Upload, Card, Table, message, Button, Space } from 'antd';
import { InboxOutlined, EyeOutlined } from '@ant-design/icons';
import { uploadDataset } from '../services/api';

const { Dragger } = Upload;

const MyDataPanel = ({ datasetList, onDatasetUploaded }) => {
    const [previewData, setPreviewData] = useState([]);
    const [previewColumns, setPreviewColumns] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleUpload = async (file) => {
        try {
            const res = await uploadDataset(file);
            message.success('上传成功');
            onDatasetUploaded({ id: res.data.id, name: file.name });
            setSelectedFile(file);
        } catch {
            message.error('上传失败');
        }
        return false; // 阻止默认上传
    };

    // 简单读取 CSV 文件内容（前端预览，无需后端）
    const previewFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) return;
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];
            for (let i = 1; i < Math.min(lines.length, 21); i++) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || ''; });
                data.push(row);
            }
            setPreviewColumns(headers.map(h => ({ title: h, dataIndex: h, ellipsis: true })));
            setPreviewData(data);
        };
        reader.readAsText(file);
    };

    const handlePreview = () => {
        if (selectedFile) {
            previewFile(selectedFile);
        } else {
            message.warning('请先上传一个文件');
        }
    };

    return (
        <Card title="上传数据集" style={{ marginBottom: 24 }}>
            <Dragger name="file" multiple={false} beforeUpload={handleUpload} showUploadList={false}
                     accept=".csv"
                     onChange={(info) => { if (info.file.status === 'done') setSelectedFile(info.file.originFileObj); }}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p>点击或拖拽 CSV 文件到此区域上传</p>
            </Dragger>
            <Space style={{ marginTop: 16 }}>
                <Button icon={<EyeOutlined />} onClick={handlePreview} disabled={!selectedFile}>
                    预览数据
                </Button>
                {selectedFile && <span>已选文件：{selectedFile.name}</span>}
            </Space>
            {previewData.length > 0 && (
                <Card title="数据预览（前20行）" style={{ marginTop: 16 }}>
                    <Table dataSource={previewData} columns={previewColumns} scroll={{ x: true }} rowKey={(_, idx) => idx} size="small" />
                </Card>
            )}
        </Card>
    );
};

export default MyDataPanel;