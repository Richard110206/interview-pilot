package com.hewei.hzyjy.xunzhi.interview.api;
import com.hewei.hzyjy.xunzhi.common.convention.result.Result;
import com.hewei.hzyjy.xunzhi.common.convention.result.Results;
import com.hewei.hzyjy.xunzhi.common.convention.annotation.CurrentUser;
import com.hewei.hzyjy.xunzhi.common.convention.context.UserContext;
import com.hewei.hzyjy.xunzhi.interview.execution.InterviewExecutionTrace;
import com.hewei.hzyjy.xunzhi.interview.service.InterviewSessionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/xunzhi/v1/interview/sessions")
public class InterviewExecutionController {
    private final InterviewSessionService sessions;
    private final InterviewExecutionTrace trace;
    @GetMapping("/{sessionId}/execution")
    public Result<List<InterviewExecutionTrace.Event>> execution(@PathVariable String sessionId, @CurrentUser UserContext user) {
        sessions.requireOwnedSession(sessionId, user.getUserId());
        return Results.success(trace.read(sessionId));
    }
}
