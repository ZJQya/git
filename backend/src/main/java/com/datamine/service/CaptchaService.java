package com.datamine.service;

import org.springframework.stereotype.Service;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import javax.imageio.ImageIO;
import java.util.Random;

@Service
public class CaptchaService {
    // 存储验证码 token -> code
    private final Map<String, String> captchaMap = new ConcurrentHashMap<>();
    private final Random random = new Random();

    // 生成验证码，返回 token 和 base64 图片
    public Map<String, String> generateCaptcha() {
        String code = String.format("%04d", random.nextInt(10000)); // 4位数字
        BufferedImage image = new BufferedImage(80, 30, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 80, 30);
        g.setColor(Color.BLACK);
        g.setFont(new Font("Arial", Font.BOLD, 20));
        g.drawString(code, 10, 22);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "png", baos);
        } catch (Exception ignored) {}
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());

        String token = UUID.randomUUID().toString();
        captchaMap.put(token, code);
        // 5分钟后过期（简单实现，用定时清理可优化）
        new Thread(() -> {
            try { Thread.sleep(300000); captchaMap.remove(token); } catch (Exception ignored) {}
        }).start();

        return Map.of("token", token, "image", base64);
    }

    // 校验验证码
    public boolean verify(String token, String code) {
        String saved = captchaMap.remove(token); // 一次性使用
        return saved != null && saved.equals(code);
    }
}