class TimeManager {
    constructor() {
        this.timeElement = document.querySelector('.time');
        this.dateElement = document.querySelector('.date');
        
        // 立即更新一次
        this.updateDateTime();
        
        // 每秒更新一次
        setInterval(() => this.updateDateTime(), 1000);
    }

    updateDateTime() {
        const now = new Date();
        
        // 更新时间
        this.timeElement.textContent = this.formatTime(now);
        
        // 更新日期
        this.dateElement.textContent = this.formatDate(now);
    }

    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        return `${year}年${month}月${day}日 星期${weekDay}`;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new TimeManager();
}); 