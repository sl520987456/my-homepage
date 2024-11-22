"use strict";

class ProfileManager {
    constructor() {
        this.initializeElements();
        this.initializeEvents();
        this.loadUserInfo();
    }

    initializeElements() {
        this.elements = {
            tabs: document.querySelectorAll('.tab-button'),
            panels: document.querySelectorAll('.tab-panel'),
            forms: {
                basic: document.querySelector('#basic-form'),
                password: document.querySelector('#password-form'),
                email: document.querySelector('#email-form')
            },
            inputs: {
                nickname: document.querySelector('#nickname'),
                username: document.querySelector('#username'),
                registerTime: document.querySelector('#registerTime'),
                lastLogin: document.querySelector('#lastLogin'),
                oldPassword: document.querySelector('#oldPassword'),
                newPassword: document.querySelector('#newPassword'),
                confirmPassword: document.querySelector('#confirmPassword'),
                email: document.querySelector('#email')
            },
            sendCodeButton: document.querySelector('.send-code-button')
        };
    }

    initializeEvents() {
        // 标签切换
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });

        // 表单提交
        this.elements.forms.basic?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBasicInfo();
        });

        this.elements.forms.password?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        this.elements.forms.email?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.bindEmail();
        });

        // 发送验证码
        this.elements.sendCodeButton?.addEventListener('click', () => {
            this.sendVerifyCode();
        });
    }

    switchTab(selectedTab) {
        // 移除所有标签和面板的活动状态
        this.elements.tabs.forEach(tab => tab.classList.remove('active'));
        this.elements.panels.forEach(panel => panel.classList.remove('active'));

        // 激活选中的标签
        selectedTab.classList.add('active');

        // 激活对应的面板
        const panelId = `${selectedTab.dataset.tab}-panel`;
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
        }
    }

    async loadUserInfo() {
        try {
            const currentUser = await AV.User.current()?.fetch();
            if (!currentUser) {
                window.location.href = 'index.html';
                return;
            }

            // 填充基本信息
            if (this.elements.inputs.nickname) {
                this.elements.inputs.nickname.value = currentUser.get('nickname') || '';
            }
            
            // 显示用户名（注册时使用的账号）
            if (this.elements.inputs.username) {
                this.elements.inputs.username.value = currentUser.get('username');
                const tipText = this.elements.inputs.username.parentElement?.querySelector('.tip-text');
                if (tipText) {
                    tipText.textContent = '注册时使用的账号';
                    tipText.style.color = 'rgba(255, 255, 255, 0.6)';
                }
            }
            
            // 检查邮箱验证状态
            const email = currentUser.get('email');
            const emailVerified = currentUser.get('emailVerified');
            
            // 显示已绑定的邮箱或未绑定状态
            const emailVerifiedView = document.querySelector('.email-verified-view');
            const emailForm = document.querySelector('#email-form');
            
            if (emailVerifiedView && emailForm) {
                if (email && emailVerified) {
                    // 显示已验证邮箱
                    emailVerifiedView.style.display = 'block';
                    emailForm.style.display = 'none';
                    const emailDisplay = emailVerifiedView.querySelector('.email-display');
                    if (emailDisplay) {
                        emailDisplay.textContent = email;
                    }
                } else {
                    // 显示邮箱绑定表单
                    emailVerifiedView.style.display = 'none';
                    emailForm.style.display = 'block';
                    
                    if (email && !emailVerified && this.elements.inputs.email) {
                        // 邮箱未验证状态
                        this.elements.inputs.email.value = email;
                        const tipText = this.elements.inputs.email.parentElement?.querySelector('.tip-text');
                        if (tipText) {
                            tipText.textContent = '邮箱未验证，请验证邮箱';
                            tipText.style.color = '#FF9500';
                        }
                    }
                }
            }
            
            const registerTime = currentUser.get('registrationDate');
            const lastLogin = currentUser.get('lastLoginTime');
            
            if (this.elements.inputs.registerTime) {
                this.elements.inputs.registerTime.value = this.formatDate(registerTime);
            }
            if (this.elements.inputs.lastLogin) {
                this.elements.inputs.lastLogin.value = this.formatDate(lastLogin);
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.showError('加载用户信息失败');
        }
    }

    formatDate(date) {
        if (!date) return '未知';
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
}); 