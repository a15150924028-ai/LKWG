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
    openOnTap: {
      type: Boolean,
      value: true
    },
    showEditTrigger: {
      type: Boolean,
      value: false
    },
    active: {
      type: Boolean,
      value: false
    },
    compact: {
      type: Boolean,
      value: false
    }
  },

  data: {
    selectedOption: null
  },

  observers: {
    "valueIndex, valueLabel": function syncCommittedValue(valueIndex, valueLabel) {
      this.setData({
        selectedOption: this.optionView(Number(valueIndex))
      });
    },

    options() {
      this.setData({
        selectedOption: this.optionView(Number(this.properties.valueIndex))
      });
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        selectedOption: this.optionView(Number(this.properties.valueIndex))
      });
    }
  },

  methods: {
    emitOpen() {
      if (this.properties.disabled) return;
      this.triggerEvent("open", {
        label: this.properties.label,
        options: this.properties.options,
        valueIndex: this.properties.valueIndex,
        valueLabel: this.properties.valueLabel
      });
    },

    optionView(index) {
      const option = this.properties.options[index];
      if (!option || !option.id) {
        return {
          id: "",
          label: "",
          icon: "",
          iconClass: "",
          iconText: "?",
          detail: ""
        };
      }
      return {
        id: option.id,
        label: option.label,
        icon: option.icon || "",
        iconClass: option.iconClass || "",
        iconText: option.iconText || "",
        detail: option.detail || ""
      };
    },

    onOpen() {
      if (!this.properties.openOnTap) return;
      this.emitOpen();
    },

    onOpenTrigger() {
      this.emitOpen();
    },

    onClear() {
      if (this.properties.disabled) return;
      this.setData({
        selectedOption: null
      });
      this.triggerEvent("change", { index: 0 });
    }
  }
});
