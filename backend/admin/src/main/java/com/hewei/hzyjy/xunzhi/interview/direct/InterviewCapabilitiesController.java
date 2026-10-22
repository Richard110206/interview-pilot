package com.hewei.hzyjy.xunzhi.interview.direct;

import com.hewei.hzyjy.xunzhi.common.convention.result.Result;
import com.hewei.hzyjy.xunzhi.common.convention.result.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class InterviewCapabilitiesController {
    private final DirectInterviewProperties properties;

    @GetMapping("/api/xunzhi/v1/interview/capabilities")
    public Result<Map<String, Object>> capabilities() {
        return Results.success(Map.of("provider", properties.getProvider(), "textSupported", true,
                "voiceSupported", !properties.isEnabled(), "demeanorSupported", !properties.isEnabled()));
    }
}
