# 思政英语词汇学习应用 - 部署指南

这是一个轻量级的纯前端Web应用，支持多种部署方式。

## 📱 应用特点

- 纯前端实现，无需后端服务器
- 支持PWA，可安装到手机桌面
- 响应式设计，完美适配移动设备
- 离线可用，数据本地存储

## 🚀 部署方式

### 1. 本地测试（当前方式）

应用已在本地运行：
- 访问地址：http://localhost:8000
- 局域网访问：http://192.168.2.13:8000
- 手机测试：确保手机和电脑在同一WiFi网络下，用手机浏览器访问 `http://192.168.2.13:8000`

### 2. 免费静态网站托管

#### GitHub Pages（推荐）
1. 创建GitHub仓库
2. 上传所有文件到仓库
3. 在仓库设置中启用GitHub Pages
4. 访问：`https://用户名.github.io/仓库名`

#### Netlify（推荐）
1. 访问 https://netlify.com
2. 拖拽项目文件夹到Netlify
3. 自动部署，获得免费域名
4. 支持自定义域名

#### Vercel
1. 访问 https://vercel.com
2. 连接GitHub仓库或直接上传
3. 自动部署，获得免费域名

### 3. 云服务器部署

#### 阿里云/腾讯云/华为云
1. 购买云服务器
2. 安装Nginx或Apache
3. 上传文件到web目录
4. 配置域名和SSL证书

#### 示例Nginx配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/vocabulary-app;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. CDN加速部署

#### 七牛云/又拍云
1. 注册CDN服务
2. 上传文件到对象存储
3. 配置CDN加速
4. 绑定自定义域名

### 5. 企业内网部署

#### 方式一：Web服务器
```bash
# 使用Python
python3 -m http.server 8000

# 使用Node.js
npx serve .

# 使用PHP
php -S localhost:8000
```

#### 方式二：Docker部署
创建 `Dockerfile`：
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

部署命令：
```bash
docker build -t vocabulary-app .
docker run -p 80:80 vocabulary-app
```

## 📁 文件结构

```
trae-projects/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js             # 核心逻辑
├── manifest.json      # PWA配置
├── 思政词汇300个.csv   # 词汇数据
└── README.md          # 说明文档
```

## 🔧 部署前检查

1. **文件完整性**：确保所有文件都已上传
2. **路径正确**：检查CSS和JS文件引用路径
3. **CSV文件**：确保词汇数据文件可正常访问
4. **HTTPS支持**：PWA功能需要HTTPS环境

## 📱 移动端安装

### iOS设备
1. 用Safari浏览器打开应用
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 确认安装

### Android设备
1. 用Chrome浏览器打开应用
2. 点击菜单按钮
3. 选择"安装应用"或"添加到主屏幕"
4. 确认安装

## 🌐 域名配置

### 免费域名
- Freenom：提供免费顶级域名
- GitHub Pages：提供 github.io 子域名
- Netlify：提供 netlify.app 子域名

### 自定义域名
1. 购买域名（阿里云、腾讯云、GoDaddy等）
2. 配置DNS解析到服务器IP
3. 配置SSL证书（Let's Encrypt免费）

## 🔒 安全配置

### HTTPS配置
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/vocabulary-app;
    index index.html;
}
```

### 安全头配置
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

## 📊 性能优化

1. **启用Gzip压缩**
2. **配置缓存策略**
3. **使用CDN加速**
4. **压缩图片资源**

## 🛠️ 故障排除

### 常见问题
1. **CSV文件无法加载**：检查文件路径和编码
2. **PWA无法安装**：确保使用HTTPS
3. **样式显示异常**：检查CSS文件路径
4. **功能不正常**：检查JavaScript控制台错误

### 调试方法
1. 打开浏览器开发者工具
2. 查看Console面板的错误信息
3. 检查Network面板的资源加载情况
4. 使用Application面板检查PWA状态

## 📞 技术支持

如果在部署过程中遇到问题，可以：
1. 检查浏览器控制台错误信息
2. 确认所有文件路径正确
3. 验证服务器配置
4. 测试不同浏览器兼容性

---

选择最适合您需求的部署方式，开始使用思政英语词汇学习应用！