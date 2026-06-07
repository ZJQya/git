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

import java.util.HashMap;
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
    // 新增：模拟支付接口
    @PostMapping("/vip/pay")
    public ResponseEntity<?> payVip(HttpServletRequest request) {
        Long userId = getUserIdFromToken(request);
        // 模拟支付逻辑（可扩展订单号等）
        userService.activateVip(userId, 30);
        return ResponseEntity.ok(Map.of("message", "支付成功，VIP已激活"));
    }

    // 检查 VIP 状态
    @GetMapping("/vip/status")
    public ResponseEntity<?> vipStatus(HttpServletRequest request) {
        Long userId = getUserIdFromToken(request);
        User user = userService.getById(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("vip", user.getVip());
        result.put("expireTime", user.getVipExpireTime()); // 允许为 null，前端会显示空
        return ResponseEntity.ok(result);
    }

    // 分析历史记录
    @GetMapping("/history")
    public ResponseEntity<?> history(HttpServletRequest request) {
        Long userId = getUserIdFromToken(request);
        List<AnalysisTask> tasks = analysisService.getUserHistory(userId);
        return ResponseEntity.ok(tasks);
    }
    //添加修改密码接口
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(HttpServletRequest request, @RequestBody Map<String, String> body) {
        Long userId = getUserIdFromToken(request);
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "参数不能为空"));
        }
        boolean success = userService.changePassword(userId, oldPassword, newPassword);
        if (!success) {
            return ResponseEntity.badRequest().body(Map.of("error", "旧密码错误"));
        }
        return ResponseEntity.ok(Map.of("message", "密码修改成功"));
    }
    @GetMapping("/vip/test-activate")
    public ResponseEntity<?> testActivate(HttpServletRequest request) {
        Long userId = getUserIdFromToken(request);
        userService.activateVip(userId, 30);
        return ResponseEntity.ok(Map.of("message", "VIP activated (test)"));
    }
}