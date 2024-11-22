class CountdownManager {
    constructor() {
        this.initializeElements();
        this.initializeEvents();
        this.loadCountdown();
        
        // 每秒更新倒计时
        setInterval(() => this.updateCountdown(), 1000);
    }

    initializeElements() {
        this.elements = {
            display: {
                timer: document.querySelector('.countdown-timer'),
                title: document.querySelector('.countdown-title')
            },
            menu: document.querySelector('.countdown-menu'),
            overlay: document.querySelector('.overlay'),
            submenu: document.querySelector('.countdown-submenu'),
            inputs: {
                title: document.querySelector('#countdown-title'),
                date: document.querySelector('#countdown-date')
            },
            buttons: {
                set: document.querySelector('.set-countdown'),
                save: document.querySelector('#save-countdown'),
                cancel: document.querySelector('#cancel-countdown')
            }
        };

        // 设置日期输入框的最小值为今天
        if (this.elements.inputs.date) {
            const today = new Date().toISOString().split('T')[0];
            this.elements.inputs.date.min = today;
        }
    }

    initializeEvents() {
        // 设置倒数日按钮点击事件
        this.elements.buttons.set?.addEventListener('click', () => this.showMenu());
        
        // 保存按钮点击事件
        this.elements.buttons.save?.addEventListener('click', () => this.saveCountdown());
        
        // 取消按钮点击事件
        this.elements.buttons.cancel?.addEventListener('click', () => this.hideMenu());
        
        // 遮罩层点击事件
        this.elements.overlay?.addEventListener('click', () => this.hideMenu());

        // 右键菜单事件
        this.elements.display.timer?.parentElement?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showSubmenu(e);
        });

        // 点击其他区域关闭右键菜单
        document.addEventListener('click', () => {
            if (this.elements.submenu) {
                this.elements.submenu.style.display = 'none';
            }
        });

        // 右键菜单项点击事件
        this.elements.submenu?.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'edit':
                    this.showMenu();
                    break;
                case 'delete':
                    this.deleteCountdown();
                    break;
                case 'reset':
                    this.resetCountdown();
                    break;
            }
        });
    }

    showMenu() {
        if (this.elements.menu && this.elements.overlay) {
            this.elements.overlay.style.display = 'block';
            this.elements.menu.style.display = 'block';
            
            setTimeout(() => {
                this.elements.overlay.classList.add('active');
                this.elements.menu.classList.add('active');
            }, 10);

            // 如果有现有的倒数日，填充表单
            const countdown = JSON.parse(localStorage.getItem('countdown'));
            if (countdown) {
                this.elements.inputs.title.value = countdown.title;
                this.elements.inputs.date.value = countdown.date;
            }
        }
    }

    hideMenu() {
        if (this.elements.menu && this.elements.overlay) {
            this.elements.overlay.classList.remove('active');
            this.elements.menu.classList.remove('active');
            
            setTimeout(() => {
                this.elements.overlay.style.display = 'none';
                this.elements.menu.style.display = 'none';
                
                // 清空输入框
                this.elements.inputs.title.value = '';
                this.elements.inputs.date.value = '';
            }, 300);
        }
    }

    showSubmenu(event) {
        if (this.elements.submenu) {
            const rect = event.target.getBoundingClientRect();
            this.elements.submenu.style.left = `${event.clientX}px`;
            this.elements.submenu.style.top = `${event.clientY}px`;
            this.elements.submenu.style.display = 'block';
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

    async saveCountdown() {
        try {
            const title = this.elements.inputs.title.value.trim();
            const date = this.elements.inputs.date.value;

            if (!title || !date) {
                this.showError('请填写完整信息');
                return;
            }

            // 检查日期是否有效
            const targetDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (targetDate < today) {
                this.showError('请选择今天或之后的日期');
                return;
            }

            const currentUser = AV.User.current();
            if (!currentUser) {
                this.showError('请先登录');
                return;
            }

            // 保存到用户数据中
            currentUser.set('countdown', { title, date });
            await currentUser.save();

            // 同时保存到本地存储作为缓存
            localStorage.setItem('countdown', JSON.stringify({ title, date }));
            
            this.updateDisplay(title, date);
            this.hideMenu();
            this.showSuccess('倒数日设置成功');
        } catch (error) {
            this.showError('保存失败：' + error.message);
        }
    }

    resetCountdown() {
        const countdown = JSON.parse(localStorage.getItem('countdown'));
        if (countdown) {
            const today = new Date().toISOString().split('T')[0];
            countdown.date = today;
            localStorage.setItem('countdown', JSON.stringify(countdown));
            this.updateDisplay(countdown.title, countdown.date);
            this.showSuccess('倒数日已重置为今天');
        }
    }

    deleteCountdown() {
        localStorage.removeItem('countdown');
        this.updateDisplay('未设置倒数日', null);
        this.showSuccess('倒数日已删除');
    }

    async loadCountdown() {
        try {
            const currentUser = AV.User.current();
            if (currentUser) {
                // 从用户数据中加载
                const countdown = currentUser.get('countdown');
                if (countdown) {
                    // 更新本地存储
                    localStorage.setItem('countdown', JSON.stringify(countdown));
                    this.updateDisplay(countdown.title, countdown.date);
                    return;
                }
            }

            // 如果没有用户数据，尝试从本地存储加载
            const localCountdown = JSON.parse(localStorage.getItem('countdown'));
            if (localCountdown) {
                this.updateDisplay(localCountdown.title, localCountdown.date);
            } else {
                this.updateDisplay('未设置倒数日', null);
            }
        } catch (error) {
            console.error('加载倒数日失败:', error);
            this.updateDisplay('未设置倒数日', null);
        }
    }

    updateCountdown() {
        const countdown = JSON.parse(localStorage.getItem('countdown'));
        if (countdown) {
            this.updateDisplay(countdown.title, countdown.date);
        }
    }

    updateDisplay(title, targetDate) {
        if (!targetDate) {
            this.elements.display.timer.textContent = '-- 天 -- 时 -- 分 -- 秒';
            this.elements.display.title.textContent = title;
            return;
        }

        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;

        if (diff < 0) {
            // 目标日期已过
            const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
            this.elements.display.timer.textContent = `已过去 ${days} 天`;
        } else {
            // 计算剩余时间
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            this.elements.display.timer.textContent = 
                `${days} 天 ${String(hours).padStart(2, '0')} 时 ${String(minutes).padStart(2, '0')} 分 ${String(seconds).padStart(2, '0')} 秒`;
        }
        this.elements.display.title.textContent = title;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new CountdownManager();
}); 