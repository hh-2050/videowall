/**
 * 主程序入口文件
 * 负责初始化所有组件并设置事件监听
 * 这是整个应用的启动点
 */

/* 等待DOM完全加载后再执行
 * DOMContentLoaded事件在HTML文档被完全加载和解析后触发
 * 不用等待样式表、图像等资源加载完成
 */
document.addEventListener('DOMContentLoaded', () => {
    /* 第一步：初始化主要组件
     * 创建应用程序需要的核心组件实例
     */
    
    // 创建视频网格实例
    // VideoGrid类负责管理所有视频相关的功能
    const videoGrid = new VideoGrid();
    
    // 创建导航栏实例
    // Navbar类负责处理顶部导航栏的行为
    const navbar = new Navbar();
    
    /* 第二步：设置布局切换按钮事件
     * 当用户点击布局切换按钮时，在2x2和3x3布局之间切换
     */
    document.getElementById('layoutToggle').addEventListener('click', () => {
        // 调用视频网格的切换布局方法
        videoGrid.toggleLayout();
    });

    /* 第三步：设置视频比例切换按钮事件
     * 当用户点击比例切换按钮时，在16:9和9:16比例之间切换
     */
    document.getElementById('aspectToggle').addEventListener('click', () => {
        // 调用视频网格的切换比例方法
        videoGrid.toggleAspectRatio();
    });

    /* 第四步：设置播放控制按钮事件
     * 控制所有视频的播放和暂停
     */
    // 获取播放/暂停按钮元素
    const playToggleBtn = document.getElementById('playToggle');
    
    // 添加点击事件处理
    playToggleBtn.addEventListener('click', () => {
        // 切换所有视频的播放状态
        const isPlaying = videoGrid.togglePlayAll();
        
        // 根据播放状态更新按钮文本
        // isPlaying为true时显示"暂停"，为false时显示"播放"
        playToggleBtn.textContent = isPlaying ? '暂停' : '播放';
    });
}); 