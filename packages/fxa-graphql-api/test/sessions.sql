CREATE TABLE `sessionTokens` (
  `tokenId` binary(32) NOT NULL,
  `tokenData` binary(32) NOT NULL,
  `uid` binary(16) NOT NULL,
  `createdAt` bigint unsigned NOT NULL,
  `uaBrowser` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `uaBrowserVersion` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `uaOS` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `uaOSVersion` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `uaDeviceType` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lastAccessTime` bigint unsigned NOT NULL DEFAULT '0',
  `uaFormFactor` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `authAt` bigint unsigned DEFAULT NULL,
  `verificationMethod` int DEFAULT NULL,
  `verifiedAt` bigint DEFAULT NULL,
  `mustVerify` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`tokenId`),
  KEY `session_uid` (`uid`),
  KEY `sessionTokens_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8_unicode_ci;