// 初始化 LeanCloud
const initLeanCloud = () => {
    if (!AV.applicationId) {
        try {
            AV.init({
                appId: "Ic56jUwZ1FN5fn6dxQJNgWV6-gzGzoHsz",
                appKey: "j7qt9OTYnGHm6OO5aQCOLHc8",
                serverURL: "https://ic56juwz.lc-cn-n1-shared.com"
            });

            // 配置请求域名
            AV._config.APIServerURL = "https://ic56juwz.lc-cn-n1-shared.com";
            
            // 设置请求超时时间
            AV._config.requestTimeout = 30000;

            console.log('LeanCloud 初始化成功');
            return true;
        } catch (error) {
            console.error('LeanCloud 初始化失败:', error);
            return false;
        }
    }
    return true;
};

// 添加错误处理
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.code === 400) {
        console.error('LeanCloud API 请求失败:', event.reason);
    }
});

// 导出初始化状态
window.leanCloudInitialized = initLeanCloud(); 