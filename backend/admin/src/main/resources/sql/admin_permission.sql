SET NAMES utf8mb4;

-- Grant admin to the demo account (id/username must match t_user.sql).
INSERT INTO admin_permission (id, user_id, username, is_admin, create_time, update_time, del_flag) VALUES (1, 1, 'demo', 1, null, null, 0);
