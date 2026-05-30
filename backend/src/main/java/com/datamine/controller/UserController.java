package com.datamine.controller;

import com.datamine.entity.AnalysisTask;
import com.datamine.entity.User;
import com.datamine.service.AnalysisService;
import com.datamine.service.UserService;
import com.datamine.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;   // 注入 JWT 工具类

    // 从请求中解析当前登录用户的 ID
    private Long getUserIdFromToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String username = jwtTokenUtil.getUsernameFromToken(token);
        User user = userService.getByUsername(username); // 需要在 UserService 中添加
        return user.getId();
    }

    // 开通 VIP（模拟支付）
    @PostMapping("/vip/activate")
    public ResponseEntity<?> activateVip(HttpServletRequest request) {
        Long userId = getUserIdFromToken(request);
        userService.activateVip(userId, 30);
        return ResponseEntity.ok(Map.of("message", "VIP activated for 30 days"));
    }

    // 检查 VIP 状态
    @GetMapping("/vip/status")
    public ResponseEntity<?> vipStatus(HttpServletRequest request) {
        Long userId = getUserIdFromToken(request);
        User user = userService.getById(userId);
        return ResponseEntity.ok(Map.of("vip", user.getVip(), "expireTime", user.getVipExpireTime()));
    }

    // 分析历史记录
    @GetMapping("/history")
    public ResponseEntity<?> history(HttpServletRequest request) {
        Long userId = getUserIdFromToken(request);
        List<AnalysisTask> tasks = analysisService.getUserHistory(userId);
        return ResponseEntity.ok(tasks);
    }
}