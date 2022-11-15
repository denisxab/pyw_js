<template>
    <div class="vselect_box">
        <label>{{ label }}</label>
        <select v-model="modelValue" @change="changeOption">
            <option disabled value="">Выбор из списка</option>
            <option
                v-if="type_select == 'dict'"
                v-for="(value, name, index) in options"
                :key="name"
                :value="name"
            >
                {{ name }}
            </option>
            <option
                v-else-if="type_select == 'list'"
                v-for="value in options"
                :key="value"
                :value="value"
            >
                {{ value }}
            </option>
        </select>
    </div>
</template>
<script lang="ts">
export default {
    props: {
        // Заголовок селектора
        label: { type: String, default: () => "Название" },
        // Какой тип опций, словарь или список
        type_select: String as () => "dict" | "list",
        // Опции
        options: {
            type: Object as () => object | any[],
        },
        modelValue: {
            type: String,
        },
        // CSS стили
        background: {
            type: String,
            default: () => "#000",
        },
        color: {
            type: String,
            default: () => "#000",
        },
    },
    // Методы
    methods: {
        changeOption(event: any) {
            this.$emit("update:modelValue", event.target.value);
        },
    },
    mounted() {
        if (this.type_select == "dict") {
            // Выбираем первую опцию
            const first_select = Object.keys(this.options)[0];
            // Обновляем переменную
            this.$emit("update:modelValue", first_select);
            // Вызываем событие изменения селектора
            this.$emit("change");
        } else if (this.type_select == "list") {
            // Выбираем первую опцию
            const first_select = this.options[0];
            // Обновляем переменную
            this.$emit("update:modelValue", first_select);
            // Вызываем событие изменения селектора
            this.$emit("change");
        }
    },
};
</script>
<style lang="scss" scoped>
.vselect_box {
    display: flex;
    flex-direction: column;
    padding: 4px;
    margin: 8px;
    border: 1px solid v-bind(color);
    border-radius: 5px;
    label {
        text-align: center;
        display: block;
        color: v-bind(color);
        border-bottom: 1px solid v-bind(color);
        padding: 8px;
    }
    select {
        flex-basis: 100%;
        display: block;
        background: transparent;
        border: none;
        color: v-bind(color);
        font-size: medium;
        padding: 4px;
        &:hover {
            box-shadow: inset 0px 0px 10px 1px v-bind(background);
        }
    }
}
</style>
