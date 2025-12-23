-- 验证tags列是否真的都是空数据

-- 检查是否有非空的tags（排除 [], null, '', 等）
SELECT
    id,
    slug,
    title,
    tags,
    CASE
        WHEN tags IS NULL THEN 'NULL'
        WHEN tags::text = '[]' THEN 'Empty Array'
        WHEN tags::text = '' THEN 'Empty String'
        WHEN tags::text = 'null' THEN 'Null String'
        ELSE 'Has Data'
    END as tag_status
FROM "Novel"
WHERE tags IS NOT NULL
ORDER BY tag_status DESC;

-- 统计各种情况的数量
SELECT
    CASE
        WHEN tags IS NULL THEN 'NULL'
        WHEN tags::text = '[]' THEN 'Empty Array []'
        WHEN tags::text = '' THEN 'Empty String'
        WHEN tags::text = 'null' THEN 'Null String'
        ELSE 'Has Real Data ⚠️'
    END as status,
    COUNT(*) as count
FROM "Novel"
GROUP BY status
ORDER BY count DESC;
