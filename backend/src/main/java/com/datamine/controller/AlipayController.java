package com.datamine.controller;

import com.alipay.api.AlipayApiException;
import com.alipay.api.internal.util.AlipaySignature;
import com.datamine.config.AlipayConfig;
import com.datamine.service.AlipayService;
import com.datamine.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/alipay")
public class AlipayController {

    @Autowired
    private AlipayService alipayService;
    @Autowired
    private AlipayConfig alipayConfig;
    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    // 创建支付订单，返回二维码链接
    @PostMapping("/create")
    public ResponseEntity<?> createPay(HttpServletRequest request) {
        Long userId = jwtTokenUtil.getUserIdFromToken(request.getHeader("Authorization").substring(7));
        try {
            Map<String, String> result = alipayService.createQrCode(userId, 30);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();   // 强制打印堆栈到控制台
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 主动查询支付状态
    @GetMapping("/query")
    public ResponseEntity<?> queryPay(@RequestParam String outTradeNo) {
        try {
            boolean success = alipayService.queryPayStatus(outTradeNo);
            return ResponseEntity.ok(Map.of("paid", success));
        } catch (Exception e) {
            // 即使出现未捕获的异常，也返回 paid:false
            return ResponseEntity.ok(Map.of("paid", false));
        }
    }
    // 异步通知接口（需放行）
    @PostMapping("/notify")
    public ResponseEntity<?> notify(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> params.put(key, values[0]));

        try {
            boolean signVerified = AlipaySignature.rsaCheckV1(
                    params, alipayConfig.getAlipayPublicKey(), "UTF-8", "RSA2");
            if (signVerified) {
                try {
                    alipayService.handleNotify(params);
                    return ResponseEntity.ok("success");
                } catch (Exception e) {
                    e.printStackTrace();
                    return ResponseEntity.badRequest().body("fail");
                }
            } else {
                return ResponseEntity.badRequest().body("fail");
            }
        } catch (AlipayApiException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("fail");
        }
    }
}