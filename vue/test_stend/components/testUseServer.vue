<!-- 

<testUseServer
    :get_h_id="test1.get_h_id"
    :label="`wbs_obj.send - func`"
    :template="test1.template"
    @send="Send"
/>

-->
<template>
    <h2 class="label">{{ label }}</h2>
    <div class="use_server">
        <div class="request">
            <vtextarea
                :background="`#3b4252`"
                :color="`#eceff4`"
                v-model="request"
            ></vtextarea>
            <div class="vselect">
                <vselect
                    :background="`#3b4252`"
                    :color="`#eceff4`"
                    v-model="selectTemplate"
                    :options="template"
                    :type_select="`dict`"
                    :label="`Шаблоны`"
                    @change="SelectChangeTemplate"
                />
                <vselect
                    :background="`#3b4252`"
                    :color="`#eceff4`"
                    :type_select="`list`"
                    v-model="selectSend"
                    :options="type_send"
                    :label="`Варианты отправки сообщения`"
                />
            </div>

            <vbutton class="vbutton" @click="ClickSend">Отправить</vbutton>
            <span class="help">ctrl+enter Отправить сообщение</span>
        </div>
        <div class="response">
            <PrettyJson :JsonPretty="Response" />
            <div class="infohid">Ожидает h_id: {{ get_h_id }}</div>
        </div>
    </div>
</template>
<script lang="ts">
import Vselect from "./UI/vselect.vue";
import PrettyJson from "../../pyjs_log/prettyJson/prettyJson.vue";
import Vtextarea from "./UI/vtextarea.vue";
import Vbutton from "./UI/vbutton.vue";
import { TTypeSend as TTypeSend, TTemplateTestSend } from "../App.vue";

export default {
    emits: ["send", "send_force", "send_dependent", "send_transaction"],
    // Компоненты
    components: { Vbutton, Vtextarea, PrettyJson, Vselect },
    // Аргументы
    props: {
        // На какой h_id ожидать ответ сервера
        get_h_id: Number,
        // Описание того что происходит
        label: String,
        // Шаблоны запросов
        template: Object as () => TTemplateTestSend,
        // Варианты отправки
        type_send: Object as () => TTypeSend[],
    },
    data() {
        return {
            // Запрос на сервер
            request: "",
            // Выбранный шаблон
            selectTemplate: "",
            // Выбранный вариант отправки
            selectSend: "",
        };
    },
    // Методы
    methods: {
        // Вызвать событие отправки
        ClickSend() {
            this.$emit(this.selectSend, this.request);
        },
        // Изменить запрос на выбранный шаблон
        SelectChangeTemplate() {
            this.request = this.template[this.selectTemplate];
        },
    },
    computed: {
        // Перехватываем ответ
        Response() {
            const r = this.$store.state.wbs.res.value[this.get_h_id];
            return r ? r : {};
        },
    },

    mounted() {
        // Отправка сообщения по комбинации `ctrl_l+enter`
        this._keyListener = function (e) {
            if (e.key == "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.ClickSend();
            }
        };
        document.addEventListener("keydown", this._keyListener.bind(this));
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this._keyListener);
    },
};
</script>
<style lang="scss" scoped>
@import "../../gcolor.scss";

.help {
    text-align: center;
    font-size: small;
    padding-top: 4px;
    color: $h_color;
}
.use_server {
    margin: 10px;
    display: flex;
    height: 50vh;
    .request {
        flex-basis: 50%;
        padding-bottom: 8px;
        width: 50%;
        display: flex;
        flex-direction: column;
        border: $БазовыйЦветПосещеннойСсылки solid 1px;
        .vbutton {
            margin-top: 6px;
        }
        .vselect {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
        }
    }
    .response {
        flex-basis: 50%;
        padding-bottom: 8px;
        width: 50%;
        display: flex;
        flex-direction: column;
        border: $БазовыйЦветПосещеннойСсылки solid 1px;

        .infohid {
            margin-top: 3px;
            align-self: center;
        }
        .prettyJson {
            overflow: auto;
        }
    }
}
</style>
