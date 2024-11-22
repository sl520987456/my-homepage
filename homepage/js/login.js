class LoginManager {
    constructor() {
        // 确保 LeanCloud 已初始化
        if (!window.leanCloudInitialized) {
            console.error('LeanCloud 未初始化');
            return;
        }

        this.initializeElements();
        this.initializeEvents();
        this.checkLoginStatus();
    }

    initializeElements() {
        this.elements = {
            container: document.querySelector('.login-container'),
            menu: document.querySelector('.login-menu'),
            submenu: document.querySelector('.login-submenu'),
            overlay: document.querySelector('.overlay'),
            inputs: {
                username: document.querySelector('#username'),
                password: document.querySelector('#password')
            },
            buttons: {
                login: document.querySelector('#login-button'),
                cancel: document.querySelector('#cancel-login')
            },
            usernameDisplay: document.querySelector('.username')
        };
    }

    initializeEvents() {
        // 登录区域点击事件
        this.elements.container?.addEventListener('click', (e) => {
            if (this.isLoggedIn()) {
                // 如果已登录，点击个人信息区域跳转到个人信息页面
                if (!e.target.closest('.submenu')) {
                    window.location.href = 'profile.html';
                }
            } else {
                // 未登录时显示登录菜单
                this.showLoginMenu();
            }
        });

        // 登录二级菜单点击事件
        this.elements.submenu?.addEventListener('click', async (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            const action = e.target.dataset.action;
            switch (action) {
                case 'login':
                    if (!this.isLoggedIn()) {
                        this.showLoginMenu();
                    }
                    break;
                case 'register':
                    if (!this.isLoggedIn()) {
                        this.showRegisterMenu();
                    }
                    break;
                case 'logout':
                    if (this.isLoggedIn() && await this.confirmDialog('确定要注销吗？')) {
                        await this.logout();
                    }
                    break;
            }
        });

        // 登录按钮点击事件
        this.elements.buttons.login?.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止表单默认提交
            if (this.elements.menu.querySelector('.menu-title').textContent === '用户登录') {
                this.login();
            } else {
                this.register();
            }
        });

        // 取消按钮点击事件
        this.elements.buttons.cancel?.addEventListener('click', () => {
            this.hideLoginMenu();
        });

        // 遮罩层点击事件
        this.elements.overlay?.addEventListener('click', () => {
            this.hideLoginMenu();
        });

        // 添加回车键登录/注册
        this.elements.inputs.password?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.elements.menu.querySelector('.menu-title').textContent === '用户登录') {
                    this.login();
                } else {
                    this.register();
                }
            }
        });
    }

    async login() {
        const account = this.elements.inputs.username.value.trim();
        const password = this.elements.inputs.password.value;

        if (!account || !password) {
            this.showError('请输入账号和密码');
            return;
        }

        try {
            let user;
            // 只允许使用邮箱登录
            if (account.includes('@')) {
                // 邮箱登录
                user = await AV.User.loginWithEmail(account, password);
            } else {
                throw new Error('请使用邮箱登录');
            }

            // 更新登录信息
            user.set('lastLoginTime', new Date());
            user.increment('loginCount');
            await user.save();
            
            // 登录成功后同步数据
            const userInfo = {
                username: user.get('username'),
                nickname: user.get('nickname'),
                email: user.get('email'),
                emailVerified: user.get('emailVerified'),
                registrationDate: user.get('registrationDate'),
                lastLoginTime: new Date()
            };

            // 保存到存储中
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 刷新显示
            window.dispatchEvent(new CustomEvent('userLoggedIn'));
            
            this.hideLoginMenu();
            this.updateUserDisplay(user.get('nickname') || account);
            this.showSuccess('登录成功');
        } catch (error) {
            this.showError('登录失败：' + this.getErrorMessage(error));
        }
    }

    async register() {
        const username = this.elements.inputs.username.value.trim();
        const password = this.elements.inputs.password.value;

        if (!username || !password) {
            this.showError('请输入账号和密码');
            return;
        }

        // 只验证邮箱格式
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);

        if (!isEmail) {
            this.showError('请使用有效的邮箱地址注册');
            return;
        }

        if (password.length < 6) {
            this.showError('密码长度至少为6位');
            return;
        }

        try {
            const user = new AV.User();
            
            // 设置用户名为邮箱
            user.setUsername(username);
            user.setPassword(password);
            user.setEmail(username);

            // 添加额外的用户信息
            user.set('nickname', username); // 默认昵称为邮箱
            user.set('registrationDate', new Date());
            user.set('lastLoginTime', new Date());
            user.set('loginCount', 1);

            await user.signUp();
            this.hideLoginMenu();
            this.updateUserDisplay(username);
            this.showSuccess('注册成功并已自动登录');
            
            window.dispatchEvent(new CustomEvent('userRegistered', { 
                detail: { username: username } 
            }));
        } catch (error) {
            this.showError('注册失败：' + this.getErrorMessage(error));
        }
    }

    async logout() {
        if (!this.isLoggedIn()) {
            return;
        }

        try {
            await AV.User.logOut();
            this.updateUserDisplay(null);
            this.showSuccess('已安全退出');
            
            // 触发注销事件
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
            
            // 隐藏二级菜单
            if (this.elements.submenu) {
                this.elements.submenu.style.opacity = '0';
                this.elements.submenu.style.visibility = 'hidden';
            }
            
            // 更新菜单项显示
            this.updateSubmenuItems(false);
            
            // 防止跳转到个人信息页面
            e.stopPropagation();
        } catch (error) {
            this.showError('注销失败：' + this.getErrorMessage(error));
        }
    }

    showLoginMenu() {
        this.elements.menu.querySelector('.menu-title').textContent = '用户登录';
        this.elements.buttons.login.textContent = '登录';
        
        // 清空输入框
        this.elements.inputs.username.value = '';
        this.elements.inputs.password.value = '';
        
        // 显示菜单和遮罩层
        this.elements.overlay.style.display = 'block';
        this.elements.menu.style.display = 'block';
        
        setTimeout(() => {
            this.elements.overlay.classList.add('active');
            this.elements.menu.classList.add('active');
            this.elements.inputs.username.focus();
        }, 10);
    }

    showRegisterMenu() {
        this.elements.menu.querySelector('.menu-title').textContent = '用户注册';
        this.elements.buttons.login.textContent = '注册';
        this.elements.buttons.login.onclick = () => this.register();
        
        this.elements.overlay.style.display = 'block';
        this.elements.menu.style.display = 'block';
        
        setTimeout(() => {
            this.elements.overlay.classList.add('active');
            this.elements.menu.classList.add('active');
            this.elements.inputs.username.focus();
        }, 10);
    }

    hideLoginMenu() {
        this.elements.overlay.classList.remove('active');
        this.elements.menu.classList.remove('active');
        
        setTimeout(() => {
            this.elements.overlay.style.display = 'none';
            this.elements.menu.style.display = 'none';
            this.elements.inputs.username.value = '';
            this.elements.inputs.password.value = '';
        }, 300);
    }

    isLoggedIn() {
        return AV.User.current() !== null;
    }

    checkLoginStatus() {
        const currentUser = AV.User.current();
        if (currentUser) {
            // 优先显示昵称，如果没有昵称则显示账号
            const displayName = currentUser.get('nickname') || currentUser.get('username');
            this.updateUserDisplay(displayName);
        } else {
            this.updateUserDisplay(null);
        }
    }

    updateUserDisplay(displayName = null) {
        if (displayName) {
            this.elements.usernameDisplay.textContent = displayName;
            this.elements.container.classList.add('logged-in');
            this.elements.container.title = '点击查看用户菜单';
        } else {
            this.elements.usernameDisplay.textContent = '未登录';
            this.elements.container.classList.remove('logged-in');
            this.elements.container.title = '点击登录';
        }
        this.updateSubmenuItems(!!displayName);
    }

    updateSubmenuItems(isLoggedIn) {
        const loginItem = this.elements.submenu?.querySelector('[data-action="login"]');
        const registerItem = this.elements.submenu?.querySelector('[data-action="register"]');
        const logoutItem = this.elements.submenu?.querySelector('[data-action="logout"]');

        if (!loginItem || !registerItem || !logoutItem) return;

        if (isLoggedIn) {
            // 已登录状态：只显示注销选项
            loginItem.style.display = 'none';
            registerItem.style.display = 'none';
            logoutItem.style.display = 'block';
        } else {
            // 未登录状态：只显示登录和注册选项
            loginItem.style.display = 'block';
            registerItem.style.display = 'block';
            logoutItem.style.display = 'none';
        }
    }

    getErrorMessage(error) {
        switch (error.code) {
            case 211:
                return '该账号不存在';
            case 210:
                return '账号或密码错误';
            case 216:
                return '未验证的手机号';
            case 217:
                return '无效的手机号';
            case 125:
                return '邮箱地址无效';
            case 219:
                return '登录失败次数超过限制，请稍后再试';
            case 1:
                return '网络连接失败，请检查网络设置';
            default:
                return error.message || '未知错误';
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

    async confirmDialog(message) {
        return new Promise((resolve) => {
            const confirmMenu = document.createElement('div');
            confirmMenu.className = 'confirm-menu';
            confirmMenu.innerHTML = `
                <div class="confirm-content">
                    <p class="confirm-message">${message}</p>
                    <div class="button-group">
                        <button class="confirm-button">确定</button>
                        <button class="cancel-button">取消</button>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmMenu);
            setTimeout(() => confirmMenu.classList.add('active'), 10);

            const cleanup = () => {
                confirmMenu.classList.remove('active');
                setTimeout(() => confirmMenu.remove(), 300);
            };

            confirmMenu.querySelector('.confirm-button').addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            confirmMenu.querySelector('.cancel-button').addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmMenu.addEventListener('click', (e) => {
                if (e.target === confirmMenu) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }
}

// 等待 LeanCloud 初始化完成后再初始化登录管理器
document.addEventListener('DOMContentLoaded', () => {
    if (window.leanCloudInitialized) {
        new LoginManager();
    } else {
        console.error('LeanCloud 初始化失败，无法启动登录功能');
    }
}); 