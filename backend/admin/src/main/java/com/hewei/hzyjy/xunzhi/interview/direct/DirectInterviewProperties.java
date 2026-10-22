package com.hewei.hzyjy.xunzhi.interview.direct;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "xunzhi-agent.interview-ai")
public class DirectInterviewProperties {
    // Explicit opt-in: existing installations continue using their cloud workflows.
    private String provider = "xingchen";
    private int questionCount = 3;
    private int maxTokens = 3072;

    public boolean isEnabled() {
        return "deepseek".equalsIgnoreCase(provider);
    }
}
