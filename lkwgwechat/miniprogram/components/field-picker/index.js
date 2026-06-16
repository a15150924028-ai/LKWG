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
      this.setData({
        query: Number(this.properties.valueIndex) > 0
          ? this.properties.valueLabel
          : "",
        selectedOption: this.optionView(Number(this.properties.valueIndex))
      });
    },

    detached() {
      if (this.blurTimer) clearTimeout(this.blurTimer);
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
        iconText: option.iconText || "",
        detail: option.detail || ""
      };
    },

    refreshSuggestions(query) {
      this.setData({
        suggestions: searchOptions(this.properties.options, query, 20)
      });
    },

    onFocus() {
      if (this.properties.disabled) return;
      if (this.blurTimer) clearTimeout(this.blurTimer);
      this.setData({ focused: true });
      this.refreshSuggestions(this.data.query);
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
        this.setData({
          query: this.committedQuery(),
          selectedOption: this.optionView(Number(this.properties.valueIndex)),
          focused: false,
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
        suggestions: []
      });
      this.triggerEvent("change", { index: 0 });
    }
  }
});
