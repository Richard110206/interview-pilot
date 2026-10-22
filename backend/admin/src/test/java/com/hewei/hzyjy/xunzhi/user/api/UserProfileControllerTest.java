package com.hewei.hzyjy.xunzhi.user.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hewei.hzyjy.xunzhi.auth.application.LoginSessionService;
import com.hewei.hzyjy.xunzhi.auth.application.PermissionService;
import com.hewei.hzyjy.xunzhi.user.api.io.req.UserProfileUpdateReqDTO;
import com.hewei.hzyjy.xunzhi.user.api.io.req.UserUpdateReqDTO;
import com.hewei.hzyjy.xunzhi.user.api.io.resp.UserRespDTO;
import com.hewei.hzyjy.xunzhi.user.service.AdminPermissionService;
import com.hewei.hzyjy.xunzhi.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserProfileControllerTest {
    private final UserService users = mock(UserService.class);
    private final UserController controller = new UserController(users, mock(AdminPermissionService.class),
            mock(LoginSessionService.class), mock(PermissionService.class));

    @Test void readsOnlyAuthenticatedProfileAndExcludesPassword() throws Exception {
        UserRespDTO user = new UserRespDTO();user.setUsername("alice");user.setPhone("13800000000");
        when(users.getUserByUsername("alice")).thenReturn(user);
        var profile = controller.currentProfile("alice").getData();
        assertEquals("alice", profile.getUsername());assertEquals("13800000000", profile.getPhone());
        assertFalse(new ObjectMapper().writeValueAsString(profile).contains("password"));
        verify(users).getUserByUsername("alice");
    }

    @Test void ignoresOverpostedIdentityPasswordAndRole() throws Exception {
        ObjectMapper mapper = new ObjectMapper().configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        var profile = mapper.readValue("{\"username\":\"victim\",\"password\":\"changed\",\"isAdmin\":true,\"realName\":\"Alice\",\"phone\":\"\",\"mail\":\"\"}", UserProfileUpdateReqDTO.class);
        controller.updateCurrentProfile(profile, "alice");
        var argument = ArgumentCaptor.forClass(UserUpdateReqDTO.class);
        verify(users).update(argument.capture(), eq("alice"));
        assertNull(argument.getValue().getUsername());assertNull(argument.getValue().getPassword());
        assertEquals("Alice", argument.getValue().getRealName());assertEquals("", argument.getValue().getPhone());
    }
}
