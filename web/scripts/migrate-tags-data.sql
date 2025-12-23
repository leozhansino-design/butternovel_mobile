-- Tags数据迁移脚本
-- 将旧的Novel.tags列数据迁移到新的Tag表和关系表

-- 步骤1: 查看现有的tags数据结构
-- 先运行这个查询，看看旧tags列的格式
SELECT id, slug, title, tags
FROM "Novel"
WHERE tags IS NOT NULL
LIMIT 5;

-- 步骤2: 根据旧数据格式，选择合适的迁移方案

-- 方案A: 如果tags是JSON数组格式 (例如: ["romance", "fantasy"])
-- 取消注释下面的代码：

/*
DO $$
DECLARE
    novel_record RECORD;
    tag_name TEXT;
    tag_record RECORD;
BEGIN
    -- 遍历所有有tags的小说
    FOR novel_record IN
        SELECT id, tags
        FROM "Novel"
        WHERE tags IS NOT NULL AND tags::text != '[]'
    LOOP
        -- 解析JSON数组中的每个tag
        FOR tag_name IN
            SELECT jsonb_array_elements_text(novel_record.tags::jsonb)
        LOOP
            -- 规范化tag名称（转小写）
            tag_name := LOWER(TRIM(tag_name));

            -- 创建或获取Tag记录
            INSERT INTO "Tag" (id, name, slug, count, "createdAt")
            VALUES (
                gen_random_uuid()::text,
                tag_name,
                tag_name,
                1,
                NOW()
            )
            ON CONFLICT (name) DO UPDATE
            SET count = "Tag".count + 1
            RETURNING id INTO tag_record;

            -- 如果tag_record为空，说明是已存在的tag，需要获取它
            IF tag_record.id IS NULL THEN
                SELECT id INTO tag_record FROM "Tag" WHERE name = tag_name;
            END IF;

            -- 创建Novel-Tag关系
            INSERT INTO "_NovelTags" ("A", "B")
            VALUES (novel_record.id, tag_record.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
*/

-- 方案B: 如果tags是逗号分隔的文本 (例如: "romance,fantasy,adventure")
-- 取消注释下面的代码：

/*
DO $$
DECLARE
    novel_record RECORD;
    tag_name TEXT;
    tag_id TEXT;
BEGIN
    -- 遍历所有有tags的小说
    FOR novel_record IN
        SELECT id, tags
        FROM "Novel"
        WHERE tags IS NOT NULL AND tags != ''
    LOOP
        -- 分割逗号分隔的tags
        FOREACH tag_name IN ARRAY string_to_array(novel_record.tags::text, ',')
        LOOP
            -- 规范化tag名称（转小写、去空格）
            tag_name := LOWER(TRIM(tag_name));

            IF tag_name != '' THEN
                -- 创建或更新Tag记录
                INSERT INTO "Tag" (id, name, slug, count, "createdAt")
                VALUES (
                    'tag_' || MD5(tag_name),
                    tag_name,
                    tag_name,
                    1,
                    NOW()
                )
                ON CONFLICT (name) DO UPDATE
                SET count = "Tag".count + 1
                RETURNING id INTO tag_id;

                -- 如果返回空，说明tag已存在，获取其ID
                IF tag_id IS NULL THEN
                    SELECT id INTO tag_id FROM "Tag" WHERE name = tag_name;
                END IF;

                -- 创建Novel-Tag关系
                INSERT INTO "_NovelTags" ("A", "B")
                VALUES (novel_record.id, tag_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;
*/

-- 步骤3: 迁移完成后验证
-- 检查迁移结果
SELECT
    n.id,
    n.slug,
    n.title,
    COUNT(t.id) as tag_count,
    STRING_AGG(t.name, ', ') as new_tags
FROM "Novel" n
LEFT JOIN "_NovelTags" nt ON nt."A" = n.id
LEFT JOIN "Tag" t ON t.id = nt."B"
WHERE n.tags IS NOT NULL
GROUP BY n.id, n.slug, n.title
ORDER BY n.id
LIMIT 10;

-- 步骤4: 确认无误后，可以安全删除旧的tags列
-- 运行: npx prisma db push
