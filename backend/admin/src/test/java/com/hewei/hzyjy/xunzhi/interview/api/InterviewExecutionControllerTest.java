package com.hewei.hzyjy.xunzhi.interview.api;
import com.hewei.hzyjy.xunzhi.common.convention.context.UserContext;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.execution.InterviewExecutionTrace;
import com.hewei.hzyjy.xunzhi.interview.service.InterviewSessionService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class InterviewExecutionControllerTest {
    @Test
    void rejectsAnotherUsersSessionBeforeReadingTrace() {
        var sessions = mock(InterviewSessionService.class);
        var trace = mock(InterviewExecutionTrace.class);
        var user = mock(UserContext.class);
        when(user.getUserId()).thenReturn(9L);
        doThrow(new ClientException("not owned")).when(sessions).requireOwnedSession("other", 9L);
        var controller = new InterviewExecutionController(sessions, trace);
        assertThrows(ClientException.class, () -> controller.execution("other", user));
        verifyNoInteractions(trace);
    }
}
