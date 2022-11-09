<template>
    <div class="log" v-show="isShow == true">
        <div class="log__info">
            <span>Подключение</span>
            <div class="textarea">{{ wbsStatus }}</div>
            <span>Ответ</span>
            <PrettyJson :JsonPretty="JsonPretty" />
        </div>
        <div class="log__use">
            <input @click="disconnect" type="button" value="Разорвать связь" />
            <!-- <input
                    @click="TestSend"
                    type="button"
                    value="Проверочный запрос"
                />
                <input
                    @click="GetAllowedFunc"
                    type="button"
                    value="Доступные функции"
                /> -->
        </div>
    </div>
    <div class="log__status">
        <div
            class="status_code"
            :class="{
                connect: wbsStatusCode == 1,
                wait_connect: wbsStatusCode == 2,
                error_connect: wbsStatusCode == 3,
            }"
        />
        <input @click="hiddenWindow" type="button" :value="isHideShow" />
    </div>
</template>
<script lang="ts">
import PrettyJson from "./prettyJson/prettyJson.vue";
import {
    ClientsWbsRequest_Mod,
    ClientsWbsRequest_GetInfoServer_id,
    WbsCloseStatus,
} from "../../wbs_type";

export default {
    components: { PrettyJson },
    props: {
        /* Показывать ли подробное окно */
        isShow: {
            type: Boolean,
            default: () => true,
            required: true,
        },
    },
    computed: {
        /* Делаем понятное имя того что око скрыто или нет */
        isHideShow() {
            return this.isShow ? "Виден" : "Скрыт";
        },
        /* Красивое отображение результата с сервера */
        JsonPretty() {
            // Получаем значение только когда лог окно видно, типо оптимизация :)
            return this.isShow ? this.$store.state.wbs.res.value : {};
        },
        wbsStatusCode() {
            return this.$store.state.wbs.wbsStatusCode;
        },
        wbsStatus() {
            return this.$store.state.wbs.wbsStatus;
        },
    },
    methods: {
        /* Тестовая отправка сообщения на сервер */
        TestSend() {
            this.$store.dispatch(`wbs/send`, {
                mod: ClientsWbsRequest_Mod.exec,
                h_id: -1,
                uid_c: 0,
                body: {
                    exec: "2+2",
                },
            });
        },
        /* Получить доступные функции на севере */
        GetAllowedFunc() {
            this.$store.dispatch(`wbs/send`, {
                mod: ClientsWbsRequest_Mod.info,
                h_id: -1,
                uid_c: 0,
                body: {
                    id_r: ClientsWbsRequest_GetInfoServer_id.help_allowed,
                    // text: undefined,
                },
            });
        },
        /* Принудительно разорвать соединение с сервером */
        disconnect() {
            this.$store.state.wbs.wbsObj.close(
                WbsCloseStatus.normal,
                "Разрыв связи из логера"
            );
        },
        /* Скрыть окно */
        hiddenWindow() {
            this.$emit("update:isShow", !this.isShow);
        },
    },
};
</script>
<style lang="scss" scoped>
@import "../gcolor.scss";

input {
    margin-left: 4px;
    background: $ЦветФонаПодсказки;
    border-radius: 5px;
    color: $БазовыйЦветТекста;
    padding: 4px;
    display: inline-block;
    border: none;
}
.prettyJson {
    overflow: auto;
    height: 100%;
}
.log {
    z-index: 99;
    position: fixed;
    bottom: 0;
    right: 0;
    background: $ЦветФона;
    height: 80vh;
    width: 80vw;
    overflow: auto;
    border: none;
    padding: 8px;
    border-radius: 10px 0 0 0;
    box-shadow: inset 0 0 15px 2px #000;
    .log__info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        height: 96%;
        span {
            align-self: flex-start;
            margin-bottom: 8px;
            font-size: small;
            margin-top: 8px;
            color: $БазовыйЦветТекста;
            background: $ЦветФонаПодсказки;
            padding: 6px;
            border-radius: 5px;
        }
        .textarea {
            resize: vertical;
            background: $ЦветФонаВсплывающегоОкна;
            border: none;
            color: $ПриглушенныйЦветТекста;
            padding: 6px;
            width: 100%;
        }
    }

    .log__use {
        display: flex;
        margin-top: 8px;
        flex-direction: row;
        flex-basis: 100%;
        input {
            flex-basis: 100%;
        }
    }
}
.log__status {
    box-shadow: inset 0 0 15px 2px #000;

    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    background: $ЦветФона;
    border: none;
    padding: 8px;
    border-radius: 0 0 0 5px;
    .status_code {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        box-shadow: inset 0 0 5px 2px $ЦветФона;
        &.connect {
            background: $Хорошо;
        }
        &.wait_connect {
            background: $Среднее;
        }
        &.error_connect {
            background: $Плохо;
        }
    }
}
</style>
