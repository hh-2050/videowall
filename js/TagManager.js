/**
 * 标签管理类
 * 这个类负责处理所有和视频标签相关的功能
 * 包括添加标签、删除标签、筛选标签等
 */
class TagManager {
    /**
     * 构造函数
     * 初始化标签管理器的基本设置
     */
    constructor() {
        // 创建一个Map来存储标签及其对应的颜色
        // 使用Map是因为它可以方便地存储键值对，并且保持插入顺序
        this.tags = new Map(); 
        
        // 初始化筛选按钮和相关功能
        this.initializeFilterButton();
        
        // 设置事件监听器
        this.setupEventListeners();
    }

    /**
     * 生成随机的柔和颜色
     * 用于给新添加的标签分配一个独特的颜色
     * @returns {string} 生成的颜色值，格式为HSL
     */
    generatePastelColor() {
        // 随机生成一个0-360的色相值
        const hue = Math.floor(Math.random() * 360);
        // 使用固定的饱和度(70%)和亮度(80%)来确保颜色柔和
        return `hsl(${hue}, 70%, 80%)`;
    }

    /**
     * 初始化筛选按钮和下拉菜单
     * 在导航栏中创建标签筛选的相关元素
     */
    initializeFilterButton() {
        // 第一步：获取导航栏元素
        const navbar = document.querySelector('.navbar-controls');
        
        // 第二步：创建筛选容器
        const filterContainer = document.createElement('div');
        // 给容器添加类名，方便CSS样式控制
        filterContainer.className = 'filter-container';
        
        // 第三步：创建筛选按钮
        const filterBtn = document.createElement('button');
        // 设置按钮样式和文本
        filterBtn.className = 'btn filter-btn';
        filterBtn.textContent = '筛选标签';
        
        // 第四步：创建下拉菜单
        const dropdown = document.createElement('div');
        // 初始状态是隐藏的
        dropdown.className = 'tag-dropdown hidden';
        
        // 第五步：组装所有元素
        filterContainer.appendChild(filterBtn);
        filterContainer.appendChild(dropdown);
        navbar.appendChild(filterContainer);
        
        // 保存下拉菜单的引用，方便后续更新
        this.dropdown = dropdown;
        
        // 立即更新下拉菜单内容
        this.updateDropdown();
    }

    /**
     * 更新下拉菜单
     * 根据当前的标签列表更新筛选菜单的内容
     */
    updateDropdown() {
        // 第一步：清空现有的下拉菜单内容
        this.dropdown.innerHTML = '';
        
        // 第二步：遍历所有标签，为每个标签创建一个选项
        this.tags.forEach((color, tagName) => {
            // 创建选项容器
            const option = document.createElement('div');
            option.className = 'tag-menu-option';
            
            // 创建颜色标记
            const colorMark = document.createElement('span');
            colorMark.className = 'color-mark';
            colorMark.style.backgroundColor = color;
            
            // 创建标签文本
            const text = document.createElement('span');
            text.textContent = tagName;
            
            // 组装选项
            option.appendChild(colorMark);
            option.appendChild(text);
            
            // 添加点击事件处理
            option.addEventListener('click', () => {
                this.filterByTag(tagName);
            });
            
            // 将选项添加到下拉菜单
            this.dropdown.appendChild(option);
        });
    }

    /**
     * 添加新标签
     * @param {string} tag - 要添加的标签名称
     * @returns {string} 返回为标签生成的颜色值
     */
    addTag(tag) {
        // 检查标签是否已存在
        if (!this.tags.has(tag)) {
            // 如果是新标签，为其生成一个柔和的颜色
            this.tags.set(tag, this.generatePastelColor());
            // 更新下拉菜单，显示新添加的标签
            this.updateDropdown();
        }
        // 返回标签对应的颜色（无论是新生成的还是已存在的）
        return this.tags.get(tag);
    }

    /**
     * 删除标签
     * @param {string} tag - 要删除的标签名称
     */
    deleteTag(tag) {
        // 第一步：从标签列表中移除这个标签
        this.tags.delete(tag);
        
        // 第二步：更新下拉菜单，移除已删除的标签
        this.updateDropdown();
        
        // 第三步：找到所有使用这个标签的视频单元格
        document.querySelectorAll(`.video-cell[data-tag="${tag}"]`).forEach(cell => {
            // 移除单元格上的标签属性
            cell.removeAttribute('data-tag');
            // 找到并移除标签显示元素
            const tagDisplay = cell.querySelector('.tag-display');
            if (tagDisplay) tagDisplay.remove();
        });
    }

    /**
     * 根据标签筛选视频
     * @param {string} tag - 要筛选的标签名称，'all'表示显示所有视频
     */
    filterVideos(tag) {
        // 获取所有视频单元格
        const cells = document.querySelectorAll('.video-cell');
        
        // 遍历每个单元格，决定是否显示
        cells.forEach(cell => {
            if (tag === 'all' || cell.getAttribute('data-tag') === tag) {
                // 如果是'all'或者标签匹配，显示单元格
                cell.style.display = '';
            } else {
                // 否则隐藏单元格
                cell.style.display = 'none';
            }
        });
    }

    /**
     * 设置事件监听器
     * 处理筛选按钮的点击和下拉菜单的显示/隐藏
     */
    setupEventListeners() {
        // 点击筛选按钮时显示/隐藏下拉菜单
        document.querySelector('.filter-btn').onclick = (e) => {
            // 切换下拉菜单的显示状态
            this.dropdown.classList.toggle('hidden');
            // 阻止事件冒泡，避免触发document的点击事件
            e.stopPropagation();
        };

        // 点击页面其他地方时隐藏下拉菜单
        document.addEventListener('click', () => {
            this.dropdown.classList.add('hidden');
        });
    }

    /**
     * 为视频单元格添加标签功能
     * @param {HTMLElement} cell - 要添加标签功能的视频单元格
     */
    addTagToCell(cell) {
        // 第一步：创建标签显示器
        const tagDisplay = document.createElement('div');
        // 设置初始样式为添加模式（显示加号）
        tagDisplay.className = 'tag-display add-mode';
        tagDisplay.textContent = '+';
        
        // 第二步：添加点击事件，显示标签菜单
        tagDisplay.onclick = (e) => {
            // 阻止事件冒泡，避免触发cell的点击事件
            e.stopPropagation();
            // 显示标签菜单
            this.showTagMenu(cell);
        };
        
        // 第三步：将标签显示器添加到单元格
        cell.appendChild(tagDisplay);
    }

    /**
     * 显示标签菜单
     * @param {HTMLElement} cell - 要显示标签菜单的单元格
     */
    showTagMenu(cell) {
        // 第一步：检查是否已存在标签菜单
        let tagMenu = cell.querySelector('.tag-menu');
        if (!tagMenu) {
            // 如果不存在，创建新的标签菜单
            tagMenu = document.createElement('div');
            tagMenu.className = 'tag-menu';
            cell.appendChild(tagMenu);
        }
        
        // 第二步：清空菜单内容，准备重新填充
        tagMenu.innerHTML = '';
        
        // 第三步：添加"新建标签"选项
        const newTagOption = document.createElement('div');
        newTagOption.className = 'tag-menu-option';
        newTagOption.textContent = '+ 新建标签';
        newTagOption.onclick = () => this.createNewTag(cell);
        tagMenu.appendChild(newTagOption);
        
        // 第四步：添加现有标签选项
        this.tags.forEach((color, tag) => {
            const option = document.createElement('div');
            option.className = 'tag-menu-option';
            option.innerHTML = `<span class="tag-color" style="background-color: ${color}"></span>${tag}`;
            option.onclick = () => this.applyTag(cell, tag);
            tagMenu.appendChild(option);
        });
        
        // 第五步：使用动画显示菜单
        requestAnimationFrame(() => {
            tagMenu.classList.add('visible');
        });
        
        // 第六步：设置自动隐藏逻辑
        const hideMenu = (e) => {
            // 检查点击是否在菜单外部
            if (!tagMenu.contains(e.target) && !cell.querySelector('.tag-display').contains(e.target)) {
                // 移除可见性类名
                tagMenu.classList.remove('visible');
                // 等待动画完成后移除菜单
                setTimeout(() => {
                    if (!tagMenu.classList.contains('visible')) {
                        tagMenu.remove();
                    }
                }, 200); // 等待过渡动画完成
                // 移除事件监听器
                document.removeEventListener('click', hideMenu);
                document.removeEventListener('mouseleave', hideMenu);
            }
        };

        // 延迟添加事件监听器，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', hideMenu);
            document.addEventListener('mouseleave', hideMenu);
        }, 0);
    }

    /**
     * 创建新标签
     * @param {HTMLElement} cell - 要添加新标签的单元格
     */
    createNewTag(cell) {
        // 弹出提示框让用户输入标签名称
        const tagName = prompt('请输入新标签名称：');
        // 检查用户是否输入了有效的标签名称
        if (tagName && tagName.trim()) {
            // 添加新标签并获取生成的颜色
            const color = this.addTag(tagName.trim());
            // 将标签应用到单元格
            this.applyTag(cell, tagName.trim());
        }
    }

    /**
     * 将标签应用到视频单元格
     * @param {HTMLElement} cell - 目标单元格
     * @param {string} tag - 要应用的标签名称
     */
    applyTag(cell, tag) {
        // 第一步：获取标签对应的颜色
        const color = this.tags.get(tag);
        
        // 第二步：设置单元格的标签属性
        cell.setAttribute('data-tag', tag);
        
        // 第三步：更新标签显示器的样式
        const tagDisplay = cell.querySelector('.tag-display');
        tagDisplay.textContent = tag;  // 显示标签名称
        tagDisplay.style.backgroundColor = color;  // 设置背景颜色
        tagDisplay.classList.remove('add-mode');  // 移除添加模式样式
        
        // 第四步：更新点击事件，点击时显示标签菜单
        tagDisplay.onclick = (e) => {
            e.stopPropagation();
            this.showTagMenu(cell);
        };
        
        // 第五步：隐藏标签菜单
        const tagMenu = cell.querySelector('.tag-menu');
        if (tagMenu) {
            tagMenu.classList.add('hidden');
        }
    }
} 