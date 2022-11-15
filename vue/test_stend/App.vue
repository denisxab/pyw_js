<template>
    <PyjsLog />
    <div class="app">
        <div class="test_box">
            <testUseServer
                :get_h_id="test_send.get_h_id"
                :label="`Тестовый стенд PywJs`"
                :template="test_send.template"
                :type_send="test_send.type_send"
                :token="token"
                :host="host"
                :port="port"
                @send="send"
                @send_force="send_force"
                @send_dependent="send_dependent"
                @send_transaction="send_transaction"
                @send_before="send_before"
            />
        </div>
    </div>
</template>
<script lang="ts">
import PrettyJson from "../pyjs_log/prettyJson/prettyJson.vue";
import TestUseServer from "./components/testUseServer.vue";
import PyjsLog from "../pyjs_log/pyjs_log.vue";
import {
    ClientsWbsRequest,
    ClientsWbsRequest_GetInfoServer_id,
    ClientsWbsRequest_Mod,
    ServerWbsResponse,
} from "../../wbs_type";
import { SendParamsBefore, TRollbackErrorCode } from "../../wbs";

function strJSON(obj: object) {
    return JSON.stringify(obj, null, 4);
}
export interface TTemplateTestSend {
    [key: string]: string;
}
// Варианты отправки
export type TTypeSend =
    | "send"
    | "send_force"
    | "send_dependent"
    | "send_transaction"
    | "send_before";

const get_h_id = 89;

const token = "sysdba";
const host = "localhost";
const port = "9999";

export default {
    components: {
        PyjsLog,
        PrettyJson,
        TestUseServer,
    },
    data() {
        return {
            token: token,
            host: host,
            port: port,
            // Проверка обычной отправки SEND
            test_send: {
                get_h_id: get_h_id,
                type_send: <TTypeSend[]>[
                    "send",
                    "send_force",
                    "send_dependent",
                    "send_transaction",
                    "send_before",
                ],
                template: <TTemplateTestSend>{
                    exec: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.exec,
                        h_id: get_h_id,
                        body: {
                            exec: "2+2",
                        },
                    }),
                    import_from_server: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.import_from_server,
                        h_id: get_h_id,
                        body: {
                            import_sts_exe: "import os",
                        },
                    }),
                    func: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.func,
                        h_id: get_h_id,
                        body: {
                            n_func: "os_exe_async",
                            args: ["ifconfig"],
                            kwargs: {},
                        },
                    }),
                    "func:transaction": strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.func,
                        h_id: get_h_id,
                        body: {
                            n_func: "readFile",
                            args: [
                                "/media/denis/dd19b13d-bd85-46bb-8db9-5b8f6cf7a825/Dowload/tes/",
                                "test.txt",
                            ],
                            kwargs: {},
                        },
                    }),
                    "info:help_allowed": strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.info,
                        h_id: get_h_id,
                        body: {
                            id_r: ClientsWbsRequest_GetInfoServer_id.help_allowed,
                        },
                    }),
                    "info:info_event": strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.info,
                        h_id: get_h_id,
                        body: {
                            id_r: ClientsWbsRequest_GetInfoServer_id.info_event,
                        },
                    }),
                    event_create: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.event_create,
                        h_id: get_h_id,
                        body: {
                            n_func: "watchDir",
                            mod: "_",
                            args: [
                                "/media/denis/dd19b13d-bd85-46bb-8db9-5b8f6cf7a825/Dowload/",
                            ],
                            kwargs: {},
                        },
                    }),
                    event_sub: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.event_sub,
                        h_id: get_h_id,
                        body: {
                            n_func: "watchDir",
                            mod: "_",
                        },
                    }),
                    event_unsub: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.event_unsub,
                        h_id: get_h_id,
                        body: {
                            n_func: "watchDir",
                            mod: "_",
                        },
                    }),
                    cache_add_key: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.cache_add_key,
                        h_id: get_h_id,
                        body: {
                            key: "current_date",
                            value: JSON.stringify({ date: Date.now() }),
                            user: "base",
                        },
                    }),
                    cache_read_key: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.cache_read_key,
                        h_id: get_h_id,
                        body: {
                            key: "current_date",
                            user: "base",
                        },
                    }),
                    send_before: strJSON(<ClientsWbsRequest>{
                        mod: ClientsWbsRequest_Mod.cache_read_key,
                        h_id: get_h_id,
                        body: {
                            key: "current_date",
                            user: "base",
                        },
                    }),
                },
            },
        };
    },
    // Методы
    methods: {
        send(request) {
            const r = JSON.parse(request);
            console.log("send");
            console.log(r);
            this.$store.dispatch(`wbs/send`, r);
        },
        send_force(request) {
            const r = JSON.parse(request);
            console.log("send_force");
            console.log(r);
            this.$store.dispatch(`wbs/send_force`, r);
        },

        send_dependent(request) {
            const r = JSON.parse(request);
            console.log("send_dependent");
            console.log(r);
            this.$store.dispatch(`wbs/send_dependent`, r);
        },
        send_transaction(request) {
            const r = JSON.parse(request);
            console.log("send_transaction");
            r["rollback"] = <TRollback>(
                error_code: TRollbackErrorCode,
                h_id: number,
                uid_c: number
            ) => {
                alert(
                    `Rollback:[error_code=${error_code}|h_id=${h_id}|uid_c=${uid_c}]\nНе получилось прочитать файл.`
                );
            };
            console.log(r);
            this.$store.dispatch(`wbs/send_transaction`, r);
        },
        send_before(request) {
            const r = JSON.parse(request);
            r["after"] = (last_res: ServerWbsResponse) => {
                alert(`Прошлый запрос ${JSON.stringify(last_res, null, 2)}`);
            };
            console.log("send_before");
            console.log(r);
            this.$store.dispatch(`wbs/send_before`, <SendParamsBefore>r);
        },
    },

    beforeCreate() {
        // Инициализируем подключение к Python серверу через Web Socket
        this.$store.dispatch("wbs/initWebSocket", {
            token: token,
            host: host,
            port: port,
        });
    },
};
</script>
<style lang="scss">
@import "../gcolor.scss";

.app {
    background: $ЦветФона;
    color: $БазовыйЦветТекста;
    min-height: 100vh;
}

.test_box {
    display: flex;
    border: 1px solid #000;
    flex-direction: column;
    height: 50%;
}
</style>
