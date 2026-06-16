const { searchOptions } = require("../../utils/search-options");

Component({
  properties: {
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
      value: "请选择"
    },
    disabled: {
      type: Boolean,
      value: false
    },
    compact: {
      type: Boolean,
      value: false
    }
  },

  data: {
    query: "",
    focused: false,
    keyboardHeight: 0,
    dropUp: false,
    selectedOption: null,
    suggestions: []
  },

  observers: {
    "valueIndex, valueLabel": function syncCommittedValue(valueIndex, valueLabel) {
      if (this.data.focused) return;
      this.setData({
        query: Number(valueIndex) > 0 ? valueLabel : "",
        selectedOption: this.optionView(Number(valueIndex))
      });
    },

    options() {
      if (!this.data.focused) return;
      this.refreshSuggestions(this.data.query);
    }
  },

  lifetimes: {
    attached() {
      this.blurTimer = null;
      this.ignoreNextBlur = false;
      this.suggestionTouching = false;
      this.suggestionTouchTimer = null;
      this.setData({
        query: Number(this.properties.valueIndex) > 0
          ? this.properties.valueLabel
          : "",
        selectedOption: this.optionView(Number(this.properties.valueIndex))
      });
    },

    detached() {
      if (this.blurTimer) clearTimeout(this.blurTimer);
      if (this.suggestionTouchTimer) clearTimeout(this.suggestionTouchTimer);
    }
  },

  methods: {
    committedQuery() {
      return Number(this.properties.valueIndex) > 0
        ? this.properties.valueLabel
        : "";
    },

    optionView(index) {
      const option = this.properties.options[index];
      if (!option || !option.id) return null;
      return {
        id: option.id,
        label: option.label,
        icon: option.icon || "",
        iconClass: option.iconClass || "",
        iconText: option.iconText || "",
        detail: option.detail || ""
      };
    },

    refreshSuggestions(query) {
      this.setData({
        suggestions: searchOptions(this.properties.options, query)
      });
    },

    updateDropDirection(keyboardHeight) {
      const height = Number(keyboardHeight) || 0;
      if (!height || !this.data.focused) {
        this.setData({ dropUp: false });
        return;
      }
      const windowInfo = typeof wx !== "undefined" && wx.getWindowInfo
        ? wx.getWindowInfo()
        : null;
      const windowHeight = Number(windowInfo?.windowHeight) || 0;
      if (!windowHeight) {
        this.setData({ dropUp: true });
        return;
      }
      this.createSelectorQuery()
        .select(".field-picker")
        .boundingClientRect((rect) => {
          if (!rect) return;
          const keyboardTop = windowHeight - height;
          const spaceBelow = keyboardTop - rect.bottom;
          const spaceAbove = rect.top;
          this.setData({
            dropUp: spaceBelow < 260 && spaceAbove > spaceBelow
          });
        })
        .exec();
    },

    onFocus() {
      if (this.properties.disabled) return;
      if (this.blurTimer) clearTimeout(this.blurTimer);
      this.setData({ focused: true });
      this.refreshSuggestions(this.data.query);
      this.updateDropDirection(this.data.keyboardHeight);
    },

    onInput(event) {
      const query = event.detail.value;
      this.setData({ query, focused: true });
      this.refreshSuggestions(query);
    },

    onBlur() {
      if (this.blurTimer) clearTimeout(this.blurTimer);
      this.blurTimer = setTimeout(() => {
        if (this.ignoreNextBlur) {
          this.ignoreNextBlur = false;
          return;
        }
        if (this.suggestionTouching) return;
        this.setData({
          query: this.committedQuery(),
          selectedOption: this.optionView(Number(this.properties.valueIndex)),
          focused: false,
          dropUp: false,
          suggestions: []
        });
      }, 120);
    },

    onSelect(event) {
      const index = Number(event.currentTarget.dataset.index);
      const option = this.properties.options[index];
      if (!option || this.properties.disabled) return;
      this.ignoreNextBlur = true;
      this.setData({
        query: option.label,
        selectedOption: this.optionView(index),
        focused: false,
        dropUp: false,
        suggestions: []
      });
      this.triggerEvent("change", { index });
    },

    onClear() {
      if (this.properties.disabled) return;
      this.ignoreNextBlur = true;
      this.setData({
        query: "",
        selectedOption: null,
        focused: false,
        dropUp: false,
        suggestions: []
      });
      this.triggerEvent("change", { index: 0 });
    },

    onSuggestionTouchStart() {
      this.suggestionTouching = true;
      if (this.blurTimer) clearTimeout(this.blurTimer);
      if (this.suggestionTouchTimer) clearTimeout(this.suggestionTouchTimer);
    },

    onSuggestionTouchEnd() {
      if (this.suggestionTouchTimer) clearTimeout(this.suggestionTouchTimer);
      this.suggestionTouchTimer = setTimeout(() => {
        this.suggestionTouching = false;
      }, 300);
    },

    onKeyboardHeightChange(event) {
      const keyboardHeight = Number(event.detail.height) || 0;
      this.setData({
        keyboardHeight,
        dropUp: keyboardHeight ? this.data.dropUp : false
      });
      if (keyboardHeight) this.updateDropDirection(keyboardHeight);
    }
  }
});
