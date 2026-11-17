-- 001：加宽密码列，以容纳 scrypt 哈希（形如 scrypt$16384$8$1$<salt>$<hash>，约 175 字符）
--
-- 老库如果沿用 MD5 时代的 CHAR(32)/VARCHAR(32)，必须先执行本脚本再升级代码，
-- 否则注册/登录升级密码时会报 "Data too long for column 'password'"。
-- 本脚本可重复执行；库名不同时可改用：mysql -D <你的库名> < 本文件。

USE `coder_hub`;

ALTER TABLE `users`
    MODIFY COLUMN `password` VARCHAR(255) NOT NULL;