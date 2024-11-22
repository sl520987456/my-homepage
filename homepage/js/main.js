class ShortcutManager {
    constructor() {
        this.initializeElements();
        this.initializeEvents();
        this.loadShortcuts();
    }

    initializeElements() {
        this.elements = {
            grid: document.querySelector('.shortcuts-grid'),
            menu: document.querySelector('.shortcut-menu'),
            overlay: document.querySelector('.overlay'),
            inputs: {
                name: document.querySelector('#shortcut-name'),
                url: document.querySelector('#shortcut-url'),
                icon: document.querySelector('#shortcut-icon')
            }
        };
    }

    initializeEvents() {
        // 添加快捷方式按钮点击事件
        document.querySelector('.shortcuts-grid')?.addEventListener('click', (e) => {
            const addButton = e.target.closest('.add-shortcut');
            if (addButton) {
                this.showAddMenu();
            }
        });

        // 快捷方式点击事件
        document.querySelector('.shortcuts-grid')?.addEventListener('click', (e) => {
            const shortcutItem = e.target.closest('.shortcut-item');
            if (shortcutItem) {
                const url = shortcutItem.dataset.url;
                if (url) window.open(url, '_blank');
            }
        });

        // 右键菜单事件
        this.elements.grid?.addEventListener('contextmenu', (e) => {
            const shortcutItem = e.target.closest('.shortcut-item');
            if (shortcutItem) {
                this.showContextMenu(e, shortcutItem);
            }
        });

        // 点击其他区域关闭右键菜单
        document.addEventListener('click', () => {
            const menu = document.querySelector('.shortcut-context-menu');
            if (menu) {
                menu.style.display = 'none';
            }
        });
    }

    async loadShortcuts() {
        try {
            // 从本地存储加载数据
            let shortcuts = JSON.parse(localStorage.getItem('shortcuts'));
            
            // 如果没有数据，使用默认快捷方式
            if (!shortcuts || shortcuts.length === 0) {
                shortcuts = this.getDefaultShortcuts();
                localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
            }
            
            this.renderShortcuts(shortcuts);
        } catch (error) {
            console.error('加载快捷方式失败:', error);
            const defaultShortcuts = this.getDefaultShortcuts();
            this.renderShortcuts(defaultShortcuts);
        }
    }

    getDefaultShortcuts() {
        return [
            {
                name: 'GitHub',
                url: 'https://github.com',
                icon: 'https://github.githubassets.com/favicons/favicon.svg'
            },
            {
                name: 'Stack Overflow',
                url: 'https://stackoverflow.com',
                icon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico'
            },
            {
                name: 'MDN',
                url: 'https://developer.mozilla.org',
                icon: 'https://developer.mozilla.org/favicon-48x48.png'
            },
            {
                name: 'LeetCode',
                url: 'https://leetcode.cn',
                icon: 'https://static.leetcode.cn/cn-mono-assets/favicon-160x160.png'
            },
            {
                name: 'CSDN',
                url: 'https://www.csdn.net',
                icon: 'https://g.csdnimg.cn/static/logo/favicon32.ico'
            },
            {
                name: 'Gitee',
                url: 'https://gitee.com',
                icon: 'https://gitee.com/assets/favicon.ico'
            },
            {
                name: 'W3School',
                url: 'https://www.w3school.com.cn',
                icon: 'https://www.w3school.com.cn/favicon.ico'
            },
            {
                name: 'Vue.js',
                url: 'https://cn.vuejs.org',
                icon: 'https://cn.vuejs.org/logo.svg'
            }
        ];
    }

    renderShortcuts(shortcuts) {
        const shortcutsHtml = shortcuts.map((shortcut, index) => `
            <div class="shortcut-item" data-url="${shortcut.url}" data-index="${index}">
                <img src="${shortcut.icon}" 
                     alt="${shortcut.name}" 
                     onerror="this.src='icons/default.svg';this.onerror=null;"
                     width="40" 
                     height="40">
                <span>${shortcut.name}</span>
            </div>
        `).join('');

        const addButton = `
            <button class="add-shortcut" aria-label="添加快捷方式">
                <img src="icons/add.svg" alt="添加" width="24" height="24">
                <span>添加快捷方式</span>
            </button>
        `;

        if (this.elements.grid) {
            this.elements.grid.innerHTML = shortcutsHtml + addButton;
            
            // 添加点击事件
            this.elements.grid.querySelectorAll('.shortcut-item').forEach(item => {
                item.addEventListener('click', () => {
                    const url = item.dataset.url;
                    if (url) window.open(url, '_blank');
                });
            });
        }
    }

    showContextMenu(event, shortcutItem) {
        event.preventDefault(); // 阻止默认右键菜单

        // 创建或获取右键菜单
        let menu = document.querySelector('.shortcut-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'shortcut-context-menu';
            menu.innerHTML = `
                <div class="submenu-item" data-action="edit">编辑</div>
                <div class="submenu-item" data-action="delete">删除</div>
            `;
            document.body.appendChild(menu);
        }

        // 添加菜单项点击事件
        menu.onclick = (e) => {
            const action = e.target.dataset.action;
            if (!action) return;

            const index = parseInt(shortcutItem.dataset.index);
            switch (action) {
                case 'edit':
                    this.editShortcut(index);
                    break;
                case 'delete':
                    this.deleteShortcut(index);
                    break;
            }
            menu.style.display = 'none';
        };

        // 设置菜单位置
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;

        // 确保菜单不会超出视窗
        const menuWidth = 120; // 预设菜单宽度
        const menuHeight = 80; // 预设菜单高度
        
        let posX = x;
        let posY = y;

        if (x + menuWidth > window.innerWidth) {
            posX = window.innerWidth - menuWidth;
        }
        if (y + menuHeight > window.innerHeight) {
            posY = window.innerHeight - menuHeight;
        }

        menu.style.left = posX + 'px';
        menu.style.top = posY + 'px';
        menu.style.display = 'block';

        // 点击其他区域关闭菜单
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // 延迟添加点击事件，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    showAddMenu() {
        // 创建遮罩层
        if (!document.querySelector('.overlay')) {
            const overlayHtml = `<div class="overlay"></div>`;
            document.body.insertAdjacentHTML('beforeend', overlayHtml);
        }

        // 创建菜单
        if (!document.querySelector('.shortcut-menu')) {
            const menuHtml = `
                <div class="shortcut-menu" role="dialog" aria-labelledby="shortcut-dialog-title" aria-modal="true">
                    <div class="menu-header">
                        <h2 id="shortcut-dialog-title" class="menu-title">添加快捷方式</h2>
                    </div>
                    <div class="menu-content">
                        <div class="input-group">
                            <label for="shortcut-name" class="required">名称</label>
                            <input type="text" id="shortcut-name" name="name" required>
                        </div>
                        <div class="input-group">
                            <label for="shortcut-url" class="required">网址</label>
                            <input type="url" id="shortcut-url" name="url" required>
                        </div>
                        <div class="input-group">
                            <label for="shortcut-icon">图标URL（可选）</label>
                            <input type="url" id="shortcut-icon" name="icon">
                        </div>
                        <div class="button-group">
                            <button type="button" id="save-shortcut">保存</button>
                            <button type="button" id="cancel-shortcut">取消</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', menuHtml);
        }

        // 获取元素引用
        const overlay = document.querySelector('.overlay');
        const menu = document.querySelector('.shortcut-menu');

        // 更新输入框引用
        this.elements.inputs = {
            name: document.querySelector('#shortcut-name'),
            url: document.querySelector('#shortcut-url'),
            icon: document.querySelector('#shortcut-icon')
        };

        // 添加事件监听
        document.querySelector('#save-shortcut')?.addEventListener('click', () => {
            this.saveShortcut();
        });

        document.querySelector('#cancel-shortcut')?.addEventListener('click', () => {
            this.hideAddMenu();
        });

        // 显示遮罩层和菜单
        if (overlay && menu) {
            overlay.style.display = 'block';
            menu.style.display = 'block';
            
            // 使用 requestAnimationFrame 确保 DOM 更新后再添加动画类
            requestAnimationFrame(() => {
                overlay.classList.add('active');
                menu.classList.add('active');
            });

            // 清空输入框
            if (this.elements.inputs) {
                this.elements.inputs.name.value = '';
                this.elements.inputs.url.value = '';
                this.elements.inputs.icon.value = '';
            }
        }
    }

    hideAddMenu() {
        const overlay = document.querySelector('.overlay');
        const menu = document.querySelector('.shortcut-menu');

        if (overlay && menu) {
            overlay.classList.remove('active');
            menu.classList.remove('active');
            
            setTimeout(() => {
                overlay.style.display = 'none';
                menu.style.display = 'none';
            }, 300);
        }
    }

    async saveShortcut() {
        try {
            const name = this.elements.inputs.name.value.trim();
            let url = this.elements.inputs.url.value.trim();
            let icon = this.elements.inputs.icon.value.trim();

            if (!name || !url) {
                throw new Error('请填写完整信息');
            }

            // 确保URL格式正确
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            const urlObj = new URL(url);

            // 如果没有提供图标，使用网站自己的favicon
            if (!icon) {
                icon = `${urlObj.origin}/favicon.ico`;
            }

            // 获取当前快捷方式列表
            let shortcuts = JSON.parse(localStorage.getItem('shortcuts') || '[]');
            shortcuts.push({ name, url, icon });

            // 保存到本地存储
            localStorage.setItem('shortcuts', JSON.stringify(shortcuts));

            this.hideAddMenu();
            this.renderShortcuts(shortcuts);
            this.showSuccess('快捷方式添加成功');
        } catch (error) {
            this.showError('添加失败：' + error.message);
        }
    }

    showError(message) {
        const errorMenu = document.querySelector('.error-menu');
        const errorMessage = document.querySelector('.error-message');
        
        if (errorMenu && errorMessage) {
            errorMessage.textContent = message;
            errorMenu.classList.add('active');

            setTimeout(() => {
                errorMenu.classList.add('hiding');
                setTimeout(() => {
                    errorMenu.classList.remove('active', 'hiding');
                }, 300);
            }, 3000);
        }
    }

    showSuccess(message) {
        const successMenu = document.querySelector('.success-menu');
        const successMessage = document.querySelector('.success-message');
        
        if (successMenu && successMessage) {
            successMessage.textContent = message;
            successMenu.classList.add('active');

            setTimeout(() => {
                successMenu.classList.add('hiding');
                setTimeout(() => {
                    successMenu.classList.remove('active', 'hiding');
                }, 300);
            }, 2000);
        }
    }

    async editShortcut(index) {
        const shortcuts = JSON.parse(localStorage.getItem('shortcuts') || '[]');
        const shortcut = shortcuts[index];
        if (shortcut) {
            this.showAddMenu();
            // 填充表单
            this.elements.inputs.name.value = shortcut.name;
            this.elements.inputs.url.value = shortcut.url;
            this.elements.inputs.icon.value = shortcut.icon;
            // 保存编辑的索引
            this.editingIndex = index;
        }
    }

    async deleteShortcut(index) {
        try {
            const shortcuts = JSON.parse(localStorage.getItem('shortcuts') || '[]');
            shortcuts.splice(index, 1);
            localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
            this.renderShortcuts(shortcuts);
            this.showSuccess('快捷方式已删除');
        } catch (error) {
            this.showError('删除失败：' + error.message);
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ShortcutManager();
}); 