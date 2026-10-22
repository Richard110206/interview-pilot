SET NAMES utf8mb4;

-- Demo account. The project currently stores plaintext passwords (inherited from
-- upstream, see docs/devlog); change this seed or register your own account.
INSERT INTO t_user (id, username, password, real_name, phone, mail, deletion_time, create_time, update_time, del_flag) VALUES (1, 'demo', '123456', '演示用户', '', '', null, NOW(), NOW(), 0);
