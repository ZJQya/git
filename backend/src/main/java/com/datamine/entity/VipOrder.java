package com.datamine.entity;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class VipOrder implements Serializable {
    private String outTradeNo;   // 商户订单号
    private Long userId;
    private Integer days;        // VIP 天数
    private String status;       // WAIT_PAY, SUCCESS, CLOSED
    private LocalDateTime createTime;
}