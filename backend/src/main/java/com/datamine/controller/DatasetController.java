package com.datamine.controller;

import com.datamine.entity.Dataset;
import com.datamine.service.DatasetService;
import com.datamine.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/dataset")
public class DatasetController {

    private final DatasetService datasetService;
    private final JwtTokenUtil jwtTokenUtil;

    public DatasetController(DatasetService datasetService, JwtTokenUtil jwtTokenUtil) {
        this.datasetService = datasetService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        // 从JWT中解析用户ID（简化处理，实际可从SecurityContext获取）
        String token = request.getHeader("Authorization").substring(7);
        Long userId = jwtTokenUtil.getUserIdFromToken(token);
        // 实际项目中应通过UserService获取ID，此处假设ID为1，需调整
        Dataset dataset = datasetService.storeFile(file, userId);
        return ResponseEntity.ok(Map.of("id", dataset.getId()));
    }

}
