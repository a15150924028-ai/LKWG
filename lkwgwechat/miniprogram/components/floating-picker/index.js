const { searchOptions } = require("../../utils/search-options");

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    label: {
      type: String,
      value: ""
    },
    options: {
      type: Array,
      value: []
    },
    valueIndex: {
      type: Number,
      value: 0
    },
    valueLabel: {
      type: String,
      value: "璇烽€夋嫨"
    }
  },

  data: {
    query: "",
    keyboardHeight: 0,
    suggestions: []
  },

  observers: {
    "visible, valueIndex, valueLabel, options": function syncVisible(visible) {
      if (!visible) return;
      const query = Number(this.properties.valueIndex) > 0
        ? this.properties.valueLabel
        : "";
      this.setData({ query });
      this.refreshSuggestions(query);
    }
  },

  lifetimes: {
    attached() {
      this.suggestionTouching = false;
      this.suggestionTouchTimer = null;
    },

    detached() {
      if (this.suggestionTouchTimer) clearTimeout(this.suggestionTouchTimer);
    }
  },

  methods: {
    refreshSuggestions(query) {
      this.setData({
        suggestions: searchOptions(this.properties.options, query)
      });
    },

    onInput(event) {
      const query = event.detail.value;
      this.setData({ query });
      this.refreshSuggestions(query);
    },

    onSelect(event) {
      const index = Number(event.currentTarget.dataset.index);
      const option = this.properties.options[index];
      if (!option) return;
      this.triggerEvent("select", { index });
      if (typeof wx !== "undefined" && wx.hideKeyboard) wx.hideKeyboard();
    },

    onClose() {
      this.triggerEvent("close");
      if (typeof wx !== "undefined" && wx.hideKeyboard) wx.hideKeyboard();
    },

    onPanelTap() {},

    onKeyboardHeightChange(event) {
      this.setData({
        keyboardHeight: Number(event.detail.height) || 0
      });
    },

    onSuggestionTouchStart() {
      this.suggestionTouching = true;
      if (this.suggestionTouchTimer) clearTimeout(this.suggestionTouchTimer);
    },

    onSuggestionTouchEnd() {
      if (this.suggestionTouchTimer) clearTimeout(this.suggestionTouchTimer);
      this.suggestionTouchTimer = setTimeout(() => {
        this.suggestionTouching = false;
      }, 300);
    }
  }
});
