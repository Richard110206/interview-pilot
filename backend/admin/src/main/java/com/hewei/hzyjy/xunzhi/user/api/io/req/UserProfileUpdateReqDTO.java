package com.hewei.hzyjy.xunzhi.user.api.io.req;

import lombok.Data;

/** Only editable profile fields; login identity, password and role are excluded. */
@Data
public class UserProfileUpdateReqDTO {
    private String realName;
    private String phone;
    private String mail;
}
