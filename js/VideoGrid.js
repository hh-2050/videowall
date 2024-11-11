/**
 * 视频网格类
 * 负责管理和控制视频网格的所有功能
 */
class VideoGrid {
    /**
     * 构造函数
     * 初始化视频网格的基本属性和状态
     */
    constructor() {
        this.currentLayout = CONFIG.defaultLayout;        // 当前布局模式(2x2或3x3)
        this.currentAspectRatio = CONFIG.defaultAspectRatio; // 当前视频比例(16:9或9:16)
        this.gridElement = document.getElementById('videoGrid'); // 网格容器元素
        this.videos = [];                                // 视频数组
        this.isPlaying = false;                         // 播放状态标志
        this.tagManager = new TagManager();             // 标签管理器实例
        this.isExtended = false;                        // 网格是否已扩展标志
        
        // 创建防抖和节流的事件处理函数
        this.debouncedScroll = this.debounce(this.handleScroll, 200);
        this.throttledResize = this.throttle(this.handleResize, 200);
        
        // 确保DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    /**
     * 初始化视频网格
     * 设置网格布局并初始化所有功能
     */
    initialize() {
        this.updateGridClass();
        this.initGrid();
        this.setupDragAndDrop();
        this.setupVideoSwap();
        this.setupScrollHandler();
    }

    /**
     * 更新网格的CSS类
     * 根据当前布局和视频比例设置对应的类名
     */
    updateGridClass() {
        const aspectClass = CONFIG.aspectRatios[this.currentAspectRatio];
        this.gridElement.className = `video-grid layout-${this.currentLayout} ${aspectClass}`;
    }

    /**
     * 保存所有视频单元格的状态
     * @returns {Array} 包含所有视频状态的数组
     */
    saveVideoStates() {
        return Array.from(this.gridElement.querySelectorAll('.video-cell'))
            .map(cell => ({
                src: cell.querySelector('video').src,           // 视频源
                isEmpty: cell.classList.contains('empty'),      // 是否为空
                tag: cell.getAttribute('data-tag'),            // 标签
                isPlaying: !cell.querySelector('video').paused  // 播放状态
            }));
    }

    /**
     * 恢复视频单元格的状态
     * @param {Array} videoStates - 要恢复的视频状态数组
     */
    restoreVideoStates(videoStates) {
        const newCells = this.gridElement.querySelectorAll('.video-cell');
        videoStates.forEach((state, index) => {
            if (newCells[index]) {
                const cell = newCells[index];
                const video = cell.querySelector('video');
                const addButton = cell.querySelector('.add-video-btn');
                const videoContainer = cell.querySelector('.video-container');
                
                if (state.src) {
                    video.src = state.src;
                    video.style.display = 'block';
                    videoContainer.style.display = 'block';
                    addButton.style.display = 'none';
                    cell.classList.remove('empty');
                    
                    if (state.tag) {
                        this.tagManager.applyTag(cell, state.tag);
                    }
                } else {
                    video.style.display = 'none';
                    videoContainer.style.display = 'none';
                    addButton.style.display = 'flex';
                    cell.classList.add('empty');
                }
            }
        });
    }

    /**
     * 初始化视频网格
     * 创建指定数量的视频单元格并添加到网格中
     */
    initGrid() {
        if (!this.gridElement) return;

        const layoutConfig = CONFIG.layouts[this.currentLayout][CONFIG.aspectRatios[this.currentAspectRatio]];
        const cellCount = layoutConfig.cells;
        this.gridElement.innerHTML = '';
        
        for (let i = 0; i < cellCount; i++) {
            const cell = this.createVideoCell(i);
            this.gridElement.appendChild(cell);
        }
    }

    /**
     * 打开文件选择对话框
     * @param {HTMLElement} cell - 目标视频单元格
     */
    openFileInput(cell) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.multiple = true;
        
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.addMultipleVideos(files, cell);
        });
        
        input.click();
    }

    /**
     * 添加多个视频到网格中
     * @param {Array<File>} files - 视频文件数组
     * @param {HTMLElement} startCell - 起始单元格
     */
    addMultipleVideos(files, startCell) {
        // 获取所有空单元格
        let emptyCells = Array.from(this.gridElement.querySelectorAll('.video-cell.empty'));
        // 获取起始单元格在空单元格数组中的索引
        let currentCellIndex = emptyCells.indexOf(startCell);
        // 计算总共需要的单元格数量
        const totalNeededCells = currentCellIndex + files.length;
        
        // 如果现有空单元格不够，需要扩展网格
        if (totalNeededCells > emptyCells.length) {
            // 扩展网格以容纳新文件
            this.extendGrid(files.length);
            // 重新获取更新后的空单元格列表
            emptyCells = Array.from(this.gridElement.querySelectorAll('.video-cell.empty'));
            // 标记网格已扩展
            this.isExtended = true;
            // 设置滚动处理
            this.setupScrollHandler();
        }
        
        // 遍历所有文件并添加到网格中
        files.forEach(file => {
            // 确保文件是视频类型
            if (file.type.startsWith('video/')) {
                // 确保有可用的空单元格
                if (currentCellIndex >= 0 && currentCellIndex < emptyCells.length) {
                    const cell = emptyCells[currentCellIndex];
                    this.addVideoToCell(cell, file);
                    currentCellIndex++;
                }
            }
        });
    }

    /**
     * 扩展网格容量
     * @param {number} additionalVideos - 需要添加的额外视频数量
     */
    extendGrid(additionalVideos) {
        const layoutConfig = CONFIG.layouts[this.currentLayout][CONFIG.aspectRatios[this.currentAspectRatio]];
        const cellsPerRow = layoutConfig.columns;
        const currentCells = this.gridElement.children.length;
        const neededCells = Math.ceil(additionalVideos / cellsPerRow) * cellsPerRow;
        
        for (let i = 0; i < neededCells; i++) {
            const cell = this.createVideoCell(currentCells + i);
            this.gridElement.appendChild(cell);
        }
    }

    /**
     * 向单元格添加视频
     * @param {HTMLElement} cell - 目标单元格
     * @param {File} file - 视频文件
     */
    addVideoToCell(cell, file) {
        // 验证文件类型是否在白名单中
        const safeVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg']);
        if (!safeVideoTypes.has(file.type)) {
            throw new Error('不支持的视频格式');
        }
        
        try {
            // 再次验证文件格式是否受支持
            if (!CONFIG.supportedFormats.includes(file.type)) {
                throw new Error(`不支持的视频格式: ${file.type}`);
            }
            
            // 验证文件大小是否超过限制
            const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
            if (file.size > MAX_FILE_SIZE) {
                throw new Error('文件大小超过限制');
            }
            
            // 获取单元格中的相关元素
            const video = cell.querySelector('video');
            const addButton = cell.querySelector('.add-video-btn');
            const videoContainer = cell.querySelector('.video-container');
            
            // 设置视频源并更新显示状态
            video.src = URL.createObjectURL(file);
            video.style.display = 'block';
            videoContainer.style.display = 'block';
            addButton.style.display = 'none';
            cell.classList.remove('empty');
            
            // 视频元数据加载完成后确保正确显示
            video.addEventListener('loadedmetadata', () => {
                video.style.display = 'block';
                videoContainer.style.display = 'block';
            });
        } catch (error) {
            // 错误处理
            console.error('添加视频失败:', error);
            this.showErrorMessage(error.message);
        }
    }

    /**
     * 切换所有视频的播放状态
     * @returns {boolean} 当前的播放状态
     */
    togglePlayAll() {
        const videos = this.gridElement.querySelectorAll('video[src]');
        this.isPlaying = !this.isPlaying;
        
        videos.forEach(video => {
            if (this.isPlaying) {
                video.play();
            } else {
                video.pause();
            }
        });
        
        return this.isPlaying;
    }

    /**
     * 设置视频交换功能
     * 允许通过拖放操作交换视频位置
     */
    setupVideoSwap() {
        // 用于存储拖动源单元格的引用
        let dragSource = null;

        // 处理拖动开始事件
        this.gridElement.addEventListener('dragstart', (e) => {
            const cell = e.target.closest('.video-cell');
            // 确保单元格存在且包含视频
            if (!cell || !cell.querySelector('video').src) {
                e.preventDefault();
                return;
            }
            
            // 记录拖动源并添加视觉效果
            dragSource = cell;
            dragSource.classList.add('dragging');
            
            // 设置拖动效果为移动
            e.dataTransfer.effectAllowed = 'move';
        });

        // 处理拖动经过目标元素事件
        this.gridElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            const targetCell = e.target.closest('.video-cell');
            
            // 忽略无效目标或自身
            if (!targetCell || targetCell === dragSource) return;
            
            // 添加视觉反馈
            targetCell.classList.add('dragover');
            e.dataTransfer.dropEffect = 'move';
        });

        // 处理拖动离开事件
        this.gridElement.addEventListener('dragleave', (e) => {
            const targetCell = e.target.closest('.video-cell');
            if (targetCell && targetCell !== dragSource) {
                // 移除视觉效果
                targetCell.classList.remove('dragover');
            }
        });

        // 处理放下事件
        this.gridElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetCell = e.target.closest('.video-cell');
            
            // 验证目标单元格
            if (!targetCell || !dragSource || targetCell === dragSource) return;

            // 保存标签信息
            const sourceTag = dragSource.getAttribute('data-tag');
            const targetTag = targetCell.getAttribute('data-tag');
            
            // 保存单元格状态
            const sourceState = this.getCellState(dragSource);
            const targetState = this.getCellState(targetCell);
            
            // 交换单元格状态
            this.applyCellState(dragSource, targetState);
            this.applyCellState(targetCell, sourceState);
            
            // 更新标签
            if (sourceTag) targetCell.setAttribute('data-tag', sourceTag);
            if (targetTag) dragSource.setAttribute('data-tag', targetTag);
            
            // 更新标签显示
            const sourceTagDisplay = dragSource.querySelector('.tag-display');
            const targetTagDisplay = targetCell.querySelector('.tag-display');
            if (sourceTagDisplay && targetTagDisplay) {
                const tempText = sourceTagDisplay.textContent;
                sourceTagDisplay.textContent = targetTagDisplay.textContent;
                targetTagDisplay.textContent = tempText;
            }

            // 清理视觉效果
            targetCell.classList.remove('dragover');
            dragSource.classList.remove('dragging');
        });

        // 处理拖动结束事件
        this.gridElement.addEventListener('dragend', () => {
            // 清理所有视觉效果
            if (dragSource) {
                dragSource.classList.remove('dragging');
            }
            this.gridElement.querySelectorAll('.dragover').forEach(cell => {
                cell.classList.remove('dragover');
            });
            // 重置拖动源
            dragSource = null;
        });
    }

    /**
     * 获取单元格状态
     * @param {HTMLElement} cell - 目标单元格
     * @returns {Object} 单元格的当前状态
     */
    getCellState(cell) {
        const video = cell.querySelector('video');
        const button = cell.querySelector('.add-video-btn');
        const videoContainer = cell.querySelector('.video-container');
        return {
            src: video.src,
            currentTime: video.currentTime,
            isPlaying: !video.paused,
            isEmpty: cell.classList.contains('empty'),
            buttonDisplay: button.style.display,
            videoDisplay: video.style.display,
            containerDisplay: videoContainer.style.display
        };
    }

    /**
     * 应用单元格状态
     * @param {HTMLElement} cell - 目标单元格
     * @param {Object} state - 要应用的状态
     */
    applyCellState(cell, state) {
        const video = cell.querySelector('video');
        const button = cell.querySelector('.add-video-btn');
        const videoContainer = cell.querySelector('.video-container');

        video.src = state.src;
        video.currentTime = state.currentTime;
        video.style.display = state.videoDisplay;
        videoContainer.style.display = state.containerDisplay;
        button.style.display = state.buttonDisplay;

        if (state.isEmpty) {
            cell.classList.add('empty');
            video.style.display = 'none';
            videoContainer.style.display = 'none';
            button.style.display = 'flex';
        } else {
            cell.classList.remove('empty');
            video.style.display = 'block';
            videoContainer.style.display = 'block';
            button.style.display = 'none';
            if (state.isPlaying) {
                video.play();
            }
        }
    }

    /**
     * 设置拖放功能
     * 允许从外部拖入视频文件
     */
    setupDragAndDrop() {
        const cells = this.gridElement.getElementsByClassName('video-cell');
        
        Array.from(cells).forEach(cell => {
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('dragover');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('dragover');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('dragover');
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    this.addMultipleVideos(files, cell);
                }
            });
        });
    }

    /**
     * 切换布局模式
     * 在2x2和3x3布局之间切换
     */
    toggleLayout() {
        const videoStates = this.saveVideoStates();
        const oldLayout = this.currentLayout;
        this.currentLayout = this.currentLayout === '2x2' ? '3x3' : '2x2';
        
        const filledCells = Array.from(this.gridElement.querySelectorAll('.video-cell:not(.empty)')).length;
        const layoutConfig = CONFIG.layouts[this.currentLayout][CONFIG.aspectRatios[this.currentAspectRatio]];
        const neededRows = Math.ceil(filledCells / layoutConfig.columns);
        const totalNeededCells = neededRows * layoutConfig.columns;
        
        this.updateGridClass();
        this.initGrid();
        
        if (totalNeededCells > layoutConfig.cells) {
            this.extendGrid(totalNeededCells - layoutConfig.cells);
            this.isExtended = true;
            this.setupScrollHandler();
        }
        
        this.setupDragAndDrop();
        this.restoreVideoStates(videoStates);
    }

    /**
     * 切换视频比例
     * 在16:9和9:16之间切换
     */
    toggleAspectRatio() {
        const videoStates = this.saveVideoStates();
        const oldAspectRatio = this.currentAspectRatio;
        this.currentAspectRatio = this.currentAspectRatio === '16:9' ? '9:16' : '16:9';
        
        const filledCells = Array.from(this.gridElement.querySelectorAll('.video-cell:not(.empty)')).length;
        const layoutConfig = CONFIG.layouts[this.currentLayout][CONFIG.aspectRatios[this.currentAspectRatio]];
        const neededRows = Math.ceil(filledCells / layoutConfig.columns);
        const totalNeededCells = neededRows * layoutConfig.columns;
        
        this.updateGridClass();
        this.initGrid();
        
        if (totalNeededCells > layoutConfig.cells) {
            this.extendGrid(totalNeededCells - layoutConfig.cells);
            this.isExtended = true;
            this.setupScrollHandler();
        }
        
        this.setupDragAndDrop();
        this.restoreVideoStates(videoStates);
    }

    /**
     * 设置滚动处理
     * 根据网格是否扩展来启用或禁用滚动
     */
    setupScrollHandler() {
        if (!this.isExtended) {
            this.gridElement.style.overflowY = 'hidden';
            return;
        }

        this.gridElement.style.overflowY = 'scroll';
    }

    /**
     * 创建视频单元格
     * @param {number} index - 单元格索引
     * @returns {HTMLElement} 创建的视频单元格元素
     */
    createVideoCell(index) {
        const cell = document.createElement('div');
        cell.className = 'video-cell empty';
        cell.setAttribute('data-index', index);
        cell.draggable = true;
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.style.display = 'none';
        
        const addButton = document.createElement('button');
        addButton.className = 'add-video-btn';
        addButton.style.display = 'flex';
        addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openFileInput(cell);
        });
        
        const video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.style.display = 'none';
        
        videoContainer.appendChild(video);
        cell.appendChild(videoContainer);
        cell.appendChild(addButton);
        
        this.tagManager.addTagToCell(cell);
        
        return cell;
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误信息
     */
    showErrorMessage(message) {
        // TODO: 实现错误提示UI
    }

    /**
     * 释放视频资源
     * 停止所有视频播放并清理资源
     */
    releaseVideoResources() {
        const videos = this.gridElement.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.src = '';
            video.load();
        });
    }

    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间(毫秒)
     * @returns {Function} 防抖处理后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间(毫秒)
     * @returns {Function} 节流处理后的函数
     */
    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = null;
                    func(...args);
                }, wait);
            }
        };
    }
} 