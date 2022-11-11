<template>
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
    <div class="log" v-show="isShow == true">
        <div class="log__use">
            <div class="h_id_s">
                <input
                    class="h_id"
                    v-for="(value, name, index) in ArrayH_ID"
                    type="button"
                    :class="{
                        update: value.is_update,
                        select: value.is_select,
                    }"
                    :value="name"
                    @click="clickHID"
                />
            </div>
            <!-- <input @click="disconnect" type="button" value="Разорвать связь" /> -->
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
        <div class="log__info">
            <span>Подключение</span>
            <div class="textarea">{{ wbsStatus }}</div>
            <span>Ответ</span>
            <PrettyJson :JsonPretty="textViewH_ID" />
        </div>
    </div>
</template>
<script lang="ts">
import PrettyJson from "./prettyJson/prettyJson.vue";
import {
    ClientsWbsRequest_Mod,
    ClientsWbsRequest_GetInfoServer_id,
    ServerWbsResponse,
    WbsCloseStatus,
} from "../../wbs_type";
import { WbsConnectStatus } from "../../wbs";

interface TH_ID {
    uid_c: string;
    // Если элемент обновлен то будет true
    is_update: boolean;
    // Элемент выбран
    is_select: boolean;
}
interface TArrH_ID {
    [key: string]: TH_ID;
}
interface TAllJson {
    [key: string]: ServerWbsResponse;
}
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
    data() {
        return {
            // Все ответы от сервера которые хранятся в хранилище `wbsStore.ts`
            AllJson: <TAllJson>{},
            // Объект для отслеживания обновления в h_id путем сравнения uid_c
            DictH_ID_CheckUid_C: <TArrH_ID>{},
            // Текст у указанного h_id
            textViewH_ID: <ServerWbsResponse>{},
            // Какой h_id сейчас показан
            viewH_ID: 0,
            // Прошлый выбранный h_id
            lastH_ID: <number | undefined>undefined,
        };
    },

    computed: {
        /* Делаем понятное имя того что око скрыто или нет */
        isHideShow() {
            return this.isShow ? "Виден" : "Скрыт";
        },
        /* Числовой статус соединения */
        wbsStatusCode(): WbsConnectStatus {
            return this.$store.state.wbs.wbsStatusCode;
        },
        /* Текстовый статус соединения */
        wbsStatus() {
            return this.$store.state.wbs.wbsStatus;
        },
        /* Список с доступные h_id на которые есть ответы сервера */
        ArrayH_ID() {
            // Выполняем логику только когда окно открыто, это такая оптимизация.
            if (this.isShow) {
                this.AllJson = this.$store.state.wbs.res.value;
                //
                // Логика обновления стаута h_id, путем сверки u_id
                //
                for (const h_id in this.AllJson) {
                    const uid_c: number = this.AllJson[h_id].uid_c;
                    // Если нет такого h_id
                    if (!this.DictH_ID_CheckUid_C[h_id]) {
                        this.DictH_ID_CheckUid_C[h_id] = {
                            uid_c: uid_c,
                            is_update: true,
                        };
                    }
                    // Если есть такой h_id, то проверяем разницу по uid_c
                    else {
                        // Если есть разница по uid_c
                        if (this.DictH_ID_CheckUid_C[h_id].uid_c != uid_c) {
                            this.DictH_ID_CheckUid_C[h_id].uid_c = uid_c;
                            this.DictH_ID_CheckUid_C[h_id].is_update = true;
                            // Если обновился текущий h_id
                            if (this.viewH_ID == h_id) {
                                // То обновляем текст
                                this.textViewH_ID = this.AllJson[h_id];
                            }
                        }
                    }
                }
                return this.DictH_ID_CheckUid_C;
            }
            return {};
        },
    },
    methods: {
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
        /* Нажатие на H_ID */
        clickHID(event: Event) {
            const elm = <HTMLInputElement>event.target;
            if (elm) {
                if (this.lastH_ID) {
                    // Убираем выбор с прошлого элемента
                    this.DictH_ID_CheckUid_C[this.lastH_ID].is_select = false;
                }
                const h_id = elm.value;
                // Меняем выбранный h_id
                this.viewH_ID = h_id;
                // Убираем обновление
                this.DictH_ID_CheckUid_C[h_id].is_update = false;
                // Устанавливаем выбор
                this.DictH_ID_CheckUid_C[h_id].is_select = true;
                // Меняем текст из h_id
                this.textViewH_ID = this.AllJson[h_id];
                // Прошлый элемент это текущий
                this.lastH_ID = h_id;
            }
        },
        // /* Тестовая отправка сообщения на сервер */
        // TestSend() {
        //     this.$store.dispatch(`wbs/send`, {
        //         mod: ClientsWbsRequest_Mod.exec,
        //         h_id: -1,
        //         uid_c: 0,
        //         body: {
        //             exec: "2+2",
        //         },
        //     });
        // },
        // /* Получить доступные функции на севере */
        // GetAllowedFunc() {
        //     this.$store.dispatch(`wbs/send`, {
        //         mod: ClientsWbsRequest_Mod.info,
        //         h_id: -1,
        //         uid_c: 0,
        //         body: {
        //             id_r: ClientsWbsRequest_GetInfoServer_id.help_allowed,
        //             // text: undefined,
        //         },
        //     });
        // },
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
    font-size: 14px;
    display: inline-block;
    border: none;
    &:hover {
        box-shadow: inset 0 0 15px 2px #000;
    }
}
.prettyJson {
    overflow: auto;
    height: 100%;
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
.log {
    z-index: 99;
    position: fixed;
    bottom: 0;
    right: 0;
    background: $ЦветФона;
    height: 80vh;
    width: 80vw;
    // overflow: auto;
    flex-direction: row;
    display: flex;
    border: none;
    padding: 8px;
    border-radius: 10px 0 0 0;
    box-shadow: inset 0 0 15px 2px #000;
    .log__info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        height: 100%;
        width: 95%;
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
        margin-top: 8px;
        height: 100%;
        margin-right: 4px;
        width: 5%;
        .h_id_s {
            overflow: scroll;
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            justify-content: start;
            input {
                font-size: 16px;
                flex-basis: 3em;
                margin: 4px;
                &.update {
                    border: 1px solid yellow;
                }
                &.select {
                    box-shadow: inset 0 0 15px 2px #000;
                }
            }
        }
    }
}
</style>
