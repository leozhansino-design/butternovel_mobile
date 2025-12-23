#!/bin/bash

# 🎨 颜色迁移脚本 - 从 Amber/Orange 到 Blue 系
# Monument Valley 蓝色主题迁移工具
#
# 使用方法: bash scripts/migrate-colors.sh
# 警告: 运行前请确保代码已提交到 git，以便出错时可以回滚

set -e

echo "🎨 开始颜色迁移 - Monument Valley 蓝色主题"
echo "============================================"
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误: 请在项目根目录运行此脚本"
  exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  警告: 检测到未提交的更改"
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    exit 1
  fi
fi

echo "📝 创建备份分支..."
BACKUP_BRANCH="backup/before-blue-migration-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
echo "✅ 备份分支已创建: $BACKUP_BRANCH"
echo ""

# 颜色映射表
declare -A color_map=(
  # 主色调映射 - Amber → Sky
  ["amber-50"]="sky-50"
  ["amber-100"]="sky-100"
  ["amber-200"]="sky-200"
  ["amber-300"]="sky-300"
  ["amber-400"]="sky-400"
  ["amber-500"]="sky-500"
  ["amber-600"]="sky-600"
  ["amber-700"]="sky-700"
  ["amber-800"]="sky-800"
  ["amber-900"]="sky-900"

  # 辅助色映射 - Orange → Blue
  ["orange-50"]="blue-50"
  ["orange-100"]="blue-100"
  ["orange-200"]="blue-200"
  ["orange-300"]="blue-300"
  ["orange-400"]="blue-400"
  ["orange-500"]="blue-600"
  ["orange-600"]="blue-700"
  ["orange-700"]="blue-800"
  ["orange-800"]="blue-900"

  # 文本颜色
  ["text-amber"]="text-sky"
  ["text-orange"]="text-blue"

  # 背景颜色
  ["bg-amber"]="bg-sky"
  ["bg-orange"]="bg-blue"

  # 边框颜色
  ["border-amber"]="border-sky"
  ["border-orange"]="border-blue"

  # Hover 状态
  ["hover:bg-amber"]="hover:bg-sky"
  ["hover:text-amber"]="hover:text-sky"
  ["hover:border-amber"]="hover:border-sky"
  ["hover:bg-orange"]="hover:bg-blue"
  ["hover:text-orange"]="hover:text-blue"

  # Ring/Focus 状态
  ["ring-amber"]="ring-sky"
  ["ring-orange"]="ring-blue"
  ["focus:ring-amber"]="focus:ring-sky"
  ["focus:ring-orange"]="focus:ring-blue"
)

# 需要处理的文件类型
file_patterns=(
  "src/**/*.tsx"
  "src/**/*.ts"
  "src/**/*.css"
)

echo "🔍 搜索需要更新的文件..."
echo ""

# 统计信息
total_replacements=0
files_modified=0

# 对每个文件模式执行替换
for pattern in "${file_patterns[@]}"; do
  # 使用 find 获取文件列表
  while IFS= read -r file; do
    if [ -f "$file" ]; then
      file_changed=false

      # 对每个颜色映射执行替换
      for old_color in "${!color_map[@]}"; do
        new_color="${color_map[$old_color]}"

        # 检查文件是否包含旧颜色
        if grep -q "$old_color" "$file" 2>/dev/null; then
          # 执行替换
          if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/$old_color/$new_color/g" "$file"
          else
            # Linux
            sed -i "s/$old_color/$new_color/g" "$file"
          fi

          count=$(grep -o "$new_color" "$file" 2>/dev/null | wc -l)
          total_replacements=$((total_replacements + count))
          file_changed=true
        fi
      done

      if [ "$file_changed" = true ]; then
        echo "  ✓ $file"
        files_modified=$((files_modified + 1))
      fi
    fi
  done < <(find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) 2>/dev/null)
done

echo ""
echo "============================================"
echo "✨ 迁移完成!"
echo ""
echo "📊 统计信息:"
echo "  - 修改文件数: $files_modified"
echo "  - 颜色替换次数: $total_replacements"
echo "  - 备份分支: $BACKUP_BRANCH"
echo ""
echo "📋 后续步骤:"
echo "  1. 运行 'npm run dev' 检查应用是否正常"
echo "  2. 检查主要页面的视觉效果"
echo "  3. 如需回滚: git checkout $BACKUP_BRANCH"
echo "  4. 满意后提交: git add . && git commit -m 'style: 迁移到蓝色主题'"
echo ""
