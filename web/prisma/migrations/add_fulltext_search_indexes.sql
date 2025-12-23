-- ButterNovel 全文搜索索引迁移
-- 日期: 2025-11-13
-- 目的: 添加 pg_trgm 扩展和 GIN 索引以优化模糊搜索性能

-- 1. 启用 pg_trgm 扩展 (PostgreSQL 三元组相似度匹配)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 为 Novel 表的 title 字段创建 GIN 索引
-- 这将大幅提升 ILIKE '%keyword%' 查询的性能 (10-100倍)
CREATE INDEX IF NOT EXISTS "novel_title_gin_idx"
ON "Novel" USING gin (title gin_trgm_ops);

-- 3. 为 Novel 表的 authorName 字段创建 GIN 索引
CREATE INDEX IF NOT EXISTS "novel_author_gin_idx"
ON "Novel" USING gin ("authorName" gin_trgm_ops);

-- 验证索引已创建
-- 运行以下查询检查索引:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Novel';
