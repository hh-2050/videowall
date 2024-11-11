/**
 * 导航栏类
 * 负责处理顶部导航栏的显示、隐藏和交互功能
 */
class Navbar {
    /**
     * 构造函数
     * 初始化导航栏并设置自动隐藏功能
     */
    constructor() {
        // 获取导航栏DOM元素
        // querySelector用于查找class为'navbar'的元素
        this.navbar = document.querySelector('.navbar');
        
        // 记录上一次滚动位置
        // 用于判断滚动方向
        this.lastScrollY = window.scrollY;
        
        // 设置自动隐藏功能
        this.setupAutoHide();
    }

    /**
     * 设置导航栏自动隐藏功能
     * 根据鼠标位置自动显示/隐藏导航栏
     */
    setupAutoHide() {
        // 创建一个定时器变量，用于延迟隐藏
        let timeout;
        
        // 监听鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            // 第一步：检查鼠标是否在顶部区域
            // e.clientY表示鼠标距离窗口顶部的距离
            if (e.clientY < 100) {  // 鼠标在距离顶部100像素的范围内
                // 显示导航栏
                this.navbar.classList.remove('hidden');
                // 清除之前的定时器
                clearTimeout(timeout);
            } else {
                // 第二步：鼠标离开顶部区域
                // 清除之前的定时器（如果存在）
                clearTimeout(timeout);
                // 设置新的定时器，2秒后隐藏导航栏
                timeout = setTimeout(() => {
                    // 添加hidden类来隐藏导航栏
                    this.navbar.classList.add('hidden');
                }, 2000);  // 2000毫秒 = 2秒
            }
        });

        // 页面加载后的初始化处理
        // 2秒后自动隐藏导航栏
        setTimeout(() => {
            this.navbar.classList.add('hidden');
        }, 2000);
    }
} 