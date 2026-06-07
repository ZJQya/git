package com.datamine.service;

import com.alibaba.fastjson.JSON;
import com.alipay.api.AlipayClient;
import com.alipay.api.request.*;
import com.alipay.api.response.*;
import com.datamine.config.AlipayConfig;
import com.datamine.entity.VipOrder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class AlipayService {

    @Autowired
    private AlipayClient alipayClient;
    @Autowired
    private AlipayConfig alipayConfig;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    @Autowired
    private UserService userService;

    private static final String ORDER_PREFIX = "vip_order:";

    @PostConstruct
    public void init() {
        System.out.println("AlipayClient injected: " + (alipayClient != null));
        System.out.println("AlipayConfig appId: " + alipayConfig.getAppId());
    }

    /**
     * 创建支付宝预下单，返回二维码链接
     */
    public Map<String, String> createQrCode(Long userId, Integer days) throws Exception {
        String outTradeNo = UUID.randomUUID().toString().replace("-", "");
        AlipayTradePrecreateRequest request = new AlipayTradePrecreateRequest();
        request.setNotifyUrl(alipayConfig.getNotifyUrl());

        Map<String, Object> bizContent = new HashMap<>();
        bizContent.put("out_trade_no", outTradeNo);
        bizContent.put("total_amount", "0.01");
        bizContent.put("subject", "VIP会员开通");
        bizContent.put("body", "开通VIP " + days + "天");
        request.setBizContent(JSON.toJSONString(bizContent));

        int retries = 3;
        AlipayTradePrecreateResponse response = null;
        for (int i = 0; i < retries; i++) {
            try {
                response = alipayClient.execute(request);
                if (response.isSuccess()) break;
                System.err.println("第" + (i+1) + "次创建订单失败：" + response.getBody());
            } catch (Exception e) {
                System.err.println("第" + (i+1) + "次创建订单异常：" + e.getMessage());
            }
            if (i < retries - 1) {
                Thread.sleep(2000); // 等待2秒后重试
            }
        }

        if (response == null || !response.isSuccess()) {
            throw new RuntimeException("支付宝下单失败，已重试" + retries + "次");
        }

        // 订单创建成功，保存到 Redis
        VipOrder order = new VipOrder();
        order.setOutTradeNo(outTradeNo);
        order.setUserId(userId);
        order.setDays(days);
        order.setStatus("WAIT_PAY");
        order.setCreateTime(LocalDateTime.now());
        redisTemplate.opsForValue().set(ORDER_PREFIX + outTradeNo, order, 1, TimeUnit.HOURS);

        Map<String, String> result = new HashMap<>();
        result.put("qrCode", response.getQrCode());
        result.put("outTradeNo", outTradeNo);
        return result;
    }
    /**
     * 主动查询支付状态
     */
    public boolean queryPayStatus(String outTradeNo) {
        try {
            AlipayTradeQueryRequest request = new AlipayTradeQueryRequest();
            Map<String, Object> bizContent = new HashMap<>();
            bizContent.put("out_trade_no", outTradeNo);
            request.setBizContent(JSON.toJSONString(bizContent));
            AlipayTradeQueryResponse response = alipayClient.execute(request);

            if (response.isSuccess() && "TRADE_SUCCESS".equals(response.getTradeStatus())) {
                Object obj = redisTemplate.opsForValue().get(ORDER_PREFIX + outTradeNo);
                VipOrder order = null;
                if (obj instanceof VipOrder) {
                    order = (VipOrder) obj;
                } else if (obj instanceof Map) {
                    // 将 LinkedHashMap 转换为 VipOrder 对象
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.registerModule(new JavaTimeModule()); // 支持 LocalDateTime
                    order = mapper.convertValue(obj, VipOrder.class);
                }

                if (order != null && "WAIT_PAY".equals(order.getStatus())) {
                    order.setStatus("SUCCESS");
                    redisTemplate.opsForValue().set(ORDER_PREFIX + outTradeNo, order, 1, TimeUnit.HOURS);
                    userService.activateVip(order.getUserId(), order.getDays());
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            System.err.println("查询订单异常（可忽略）: " + e.getMessage());
            return false;
        }
    }
    /**
     * 异步通知处理
     */
    public void handleNotify(Map<String, String> params) throws Exception {
        String outTradeNo = params.get("out_trade_no");
        String tradeStatus = params.get("trade_status");
        if (!"TRADE_SUCCESS".equals(tradeStatus)) return;

        Object obj = redisTemplate.opsForValue().get(ORDER_PREFIX + outTradeNo);
        VipOrder order = null;
        if (obj instanceof VipOrder) {
            order = (VipOrder) obj;
        } else if (obj instanceof Map) {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            order = mapper.convertValue(obj, VipOrder.class);
        }

        if (order == null) {
            System.err.println("异步通知：订单不存在 " + outTradeNo);
            return;
        }
        if ("WAIT_PAY".equals(order.getStatus())) {
            order.setStatus("SUCCESS");
            redisTemplate.opsForValue().set(ORDER_PREFIX + outTradeNo, order, 1, TimeUnit.HOURS);
            userService.activateVip(order.getUserId(), order.getDays());
        }
    }
}