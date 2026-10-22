package com.hewei.hzyjy.xunzhi.interview.project;

import com.hewei.hzyjy.xunzhi.common.convention.annotation.CurrentUser;
import com.hewei.hzyjy.xunzhi.common.convention.context.UserContext;
import com.hewei.hzyjy.xunzhi.common.convention.result.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/xunzhi/v1/interview/sessions/{sessionId}/project") @RequiredArgsConstructor
public class InterviewProjectController {
    private final InterviewProjectImportService projects;
    public record Message(String message) { }
    @PostMapping("/messages")
    public Result<InterviewProjectStore.ImportJob> message(@PathVariable String sessionId,@RequestBody Message request,@CurrentUser UserContext user) {
        return Results.success(projects.submit(sessionId,user.getUserId(),user.getUsername(),request.message()));
    }
    @GetMapping
    public Result<InterviewProjectStore.ImportJob> status(@PathVariable String sessionId,@CurrentUser UserContext user) {
        return Results.success(projects.read(sessionId,user.getUserId()));
    }
}
