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

  methods: {
    onPickerChange(event) {
      this.triggerEvent("change", {
        index: Number(event.detail.value)
      });
    }
  }
});
