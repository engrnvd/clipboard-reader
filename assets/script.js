const tab = {
    recent: 'Recent',
    pinned: 'Pinned',
}
const app = new Vue({
    el: '#app',
    data: {
        tabs: [tab.recent, tab.pinned],
        items: [],
        selectedItem: null,
        selectedTab: tab.recent,
    },
    computed: {
        selectedItemIdx() {
            return this.itemsToShow.indexOf(this.selectedItem)
        },
        selectedTabIdx() {
            return this.tabs.indexOf(this.selectedTab)
        },
        recentItems() {
            return this.items.filter((item) => !item.pinned)
        },
        pinnedItems() {
            return this.items.filter((item) => item.pinned)
        },
        itemsToShow() {
            return this.selectedTab === tab.pinned ? this.pinnedItems : this.recentItems
        },
    },
    methods: {
        keydown(e) {
            switch (e.key) {
                case 'ArrowUp':
                    this.selectPreviousItem()
                    break
                case 'ArrowDown':
                    this.selectNextItem()
                    break
                case 'ArrowLeft':
                    if (e.metaKey) {
                        this.selectedItem.pinned = false
                        this.saveItems()
                    }
                    this.selectPreviousTab()
                    break
                case 'ArrowRight':
                    if (e.metaKey) {
                        this.selectedItem.pinned = true
                        this.saveItems()
                    }
                    this.selectNextTab()
                    break
                case 'Enter':
                    this.pasteItem()
                    break
                case 'Escape':
                    window.electronAPI.hideWindow()
                    break
                case 'Delete':
                    const idx = this.selectedItemIdx
                    this.removeItem(this.selectedItem)
                    this.selectItem(this.itemsToShow[idx] || this.itemsToShow[0])
                    break
            }
        },
        readClipBoard() {
            const text = window.clipboard.readText()
            if (text && !this.items.find(i => i.text === text)) {
                this.items.unshift({ text, pinned: false })
                if (this.recentItems.length > 20) this.removeItem(this.recentItems.at(-1))
                this.saveItems()
            }
        },
        getItems() {
            let items = localStorage.getItem('clipboard-items')
            if (items) this.items = JSON.parse(items).map(item => {
                if (item?.text) return item
                return { text: item, pinned: false }
            })

            if (!this.selectedItem || !this.items.includes(this.selectedItem)) this.selectedItem = this.items[0]
        },
        saveItems() {
            localStorage.setItem('clipboard-items', JSON.stringify(this.items))
        },
        removeItem(item) {
            this.items.splice(this.items.indexOf(item), 1)
            this.saveItems()

            const clipText = window.clipboard.readText()
            if (clipText === item.text) window.clipboard.clear()
        },
        selectItem(item) {
            this.selectedItem = item
        },
        selectTab(tab) {
            this.selectedTab = tab
        },
        selectNextItem() {
            let idx = this.selectedItemIdx + 1
            if (idx >= this.itemsToShow.length) idx = 0
            this.selectItem(this.itemsToShow[idx])
        },
        selectPreviousItem() {
            let idx = this.selectedItemIdx - 1
            if (idx < 0) idx = this.itemsToShow.length - 1
            this.selectItem(this.itemsToShow[idx])
        },
        selectNextTab() {
            let idx = this.selectedTabIdx + 1
            if (idx >= this.tabs.length) idx = 0
            this.selectTab(this.tabs[idx])
        },
        selectPreviousTab() {
            let idx = this.selectedTabIdx - 1
            if (idx < 0) idx = this.tabs.length - 1
            this.selectTab(this.tabs[idx])
        },
        pasteItem(item = null) {
            window.electronAPI.pasteItem(item?.text || this.selectedItem.text)
        },
    },
    mounted() {
        setInterval(this.readClipBoard, 1000)
        this.getItems()

        document.addEventListener('keydown', this.keydown)
    }
})



