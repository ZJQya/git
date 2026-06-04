package com.datamine.service;

import com.datamine.entity.Dataset;
import com.datamine.mapper.DatasetMapper;
import com.datamine.util.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DatasetService {

    private final DatasetMapper datasetMapper;
    private final Path uploadDir;

    public DatasetService(DatasetMapper datasetMapper,
                          @Value("${file.upload-dir:uploads}") String uploadDir) {
        this.datasetMapper = datasetMapper;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public Dataset storeFile(MultipartFile file, Long userId) {
        String originalName = file.getOriginalFilename();
        String storedName = UUID.randomUUID() + "_" + originalName;
        try {
            Path targetLocation = this.uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            Dataset dataset = new Dataset();
            dataset.setUserId(userId);
            dataset.setOriginalName(originalName);
            dataset.setStoredPath(targetLocation.toString());
            dataset.setFileSize(file.getSize());
            dataset.setUploadTime(LocalDateTime.now());
            datasetMapper.insert(dataset);
            return dataset;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalName, ex);
        }
    }

    public void deleteDataset(Long datasetId) {
        Dataset dataset = datasetMapper.selectById(datasetId);
        if (dataset == null) return;
        // 删除物理文件
        try {
            Path filePath = Paths.get(dataset.getStoredPath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", dataset.getStoredPath());
        }
        // 删除数据库记录
        datasetMapper.deleteById(datasetId);
    }
}
