const bcrypt = require('bcryptjs')

// 从命令行获取密码，如果没有就用默认值
const password = process.argv[2] || 'admin123'

// 生成加密哈希
const hash = bcrypt.hashSync(password, 10)

console.log('\n=================================')
console.log('原始密码:', password)
console.log('加密哈希:', hash)
console.log('=================================\n')
console.log('复制上面的哈希值到你的代码中!')