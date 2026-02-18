import { defineComponent, h } from 'vue'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'
import type { Option } from '@/composables/tareas/tareaScheduleUtils'

export const ConfigField = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    options: {
      type: Array as () => Array<string | Option>,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    hideLabel: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const normalizeOptions = () =>
      (props.options as Array<string | Option>).map(opt =>
        typeof opt === 'string'
          ? { label: opt, value: opt }
          : opt
      )

    return () =>
      h('div', [
        props.hideLabel
          ? null
          : h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h(SearchableSelect, {
          modelValue: props.modelValue || null,
          options: normalizeOptions(),
          placeholder: 'Seleccionar',
          disabled: props.disabled,
          required: props.required,
          'onUpdate:modelValue': (value: string | number) => emit('update:modelValue', String(value ?? ''))
        })
      ])
  }
})

export const DateField = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    minDate: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('div', [
        h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h('input', {
          type: 'date',
          value: props.modelValue,
          min: props.minDate || undefined,
          disabled: props.disabled,
          required: props.required,
          class: 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00357F]/20 focus:border-[#00357F] disabled:bg-slate-100 disabled:cursor-not-allowed',
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value)
        })
      ])
  }
})

export const SelectField = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array as () => Option[],
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: 'Seleccionar'
    },
    hideLabel: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('div', [
        props.hideLabel
          ? null
          : h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h(SearchableSelect, {
          modelValue: props.modelValue || null,
          options: props.options,
          placeholder: props.placeholder,
          disabled: props.disabled,
          required: props.required,
          'onUpdate:modelValue': (value: string | number) => emit('update:modelValue', value)
        })
      ])
  }
})
