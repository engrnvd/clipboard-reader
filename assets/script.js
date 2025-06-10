const app = new Vue({
    el: '#app',
    data: {
        items: [],
        selectedItem: null,
    },
    computed: {
        selectedIdx() {
            return this.items.indexOf(this.selectedItem)
        },
    },
    methods: {
        keydown(e) {
            console.log(e)
            switch (e.key) {
                case 'ArrowUp':
                    this.selectPrevious()
                    break
                case 'ArrowDown':
                    this.selectNext()
                    break
                case 'Enter':
                    this.pasteItem()
                    break
                case 'Escape':
                    window.electronAPI.hideWindow()
                    break
                case 'Delete':
                    const idx = this.selectedIdx
                    this.removeItem(this.selectedItem)
                    this.selectItem(this.items[idx] || this.items[0])
                    break
            }
        },
        readClipBoard() {
            const clipText = window.clipboard.readText();
            if (clipText && !this.items.includes(clipText)) {
                this.items.unshift(clipText);
                this.items = this.items.slice(0, 20)
                this.saveItems();
            }
        },
        getItems() {
            let items = localStorage.getItem('clipboard-items')
            if (items) this.items = JSON.parse(items)

            if (!this.selectedItem || !this.items.includes(this.selectedItem)) this.selectedItem = this.items[0]
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
        selectItem(item) {
            this.selectedItem = item
        },
        selectNext() {
            let idx = this.selectedIdx + 1
            if (idx >= this.items.length) idx = 0
            this.selectItem(this.items[idx])
        },
        selectPrevious() {
            let idx = this.selectedIdx - 1
            if (idx < 0) idx = this.items.length - 1
            this.selectItem(this.items[idx])
        },
        pasteItem(item = null) {
            window.electronAPI.pasteItem(item || this.selectedItem)
        },
    },
    mounted() {
        setInterval(this.readClipBoard, 1000);
        this.getItems();

        document.addEventListener('keydown', this.keydown)
    }
});



