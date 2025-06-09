const app = new Vue({
    el: '#app',
    data: {
        items: [],
        showCopiedSnackbar: false,
    },
    methods: {
        readClipBoard() {
            const clipText = window.clipboard.readText();
            if (clipText && !this.items.includes(clipText)) {
                this.items.unshift(clipText);
                this.saveItems();
            }
        },
        getItems() {
            let items = localStorage.getItem('clipboard-items');
            if (items) this.items = JSON.parse(items);
        },
        saveItems() {
            localStorage.setItem('clipboard-items', JSON.stringify(this.items));
        },
        removeItem(text) {
            this.items.splice(this.items.indexOf(text), 1);
            this.saveItems();

            const clipText = window.clipboard.readText();
            if (clipText === text) window.clipboard.clear();
        },
        copyText(text) {
            window.clipboard.writeText(text);
            this.showCopiedSnackbar = true;
            setTimeout(() => this.showCopiedSnackbar = false, 1500);
            window.electronAPI.sendItem(text)
        }
    },
    mounted() {
        setInterval(this.readClipBoard, 1000);
        this.getItems();
    }
});



