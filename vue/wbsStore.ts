import {
    SendParams,
    SendParamsTransaction,
    Wbs,
    WbsConnectStatus,
} from "../wbs";
import { ServerWbsResponse } from "../wbs_type";

const token = "sysdba";
const host = "localhost";
const port = 9999;

export const wbsStore = {
    // Доступные переменные в хранилище
    state() {
        return {
            // Объект для взаимодействие с Web Socket
            wbsObj: Object as () => WebSocket,
            // Текстовый статус подключения к серверу через Web Socket
            wbsStatus: "",
            // Статус код подключения к серверу через Web Socket
            wbsStatusCode: WbsConnectStatus.wait_connect,
            // Ответ от сервера --------
            res: { value: {} },
            //--------------------------
        };
    },
    // Вычисляемые функции аналогичные `computed`
    getters: {},
    // Синхронные функции для изменения данных в переменных
    mutations: {
        _updateWbsObj(state, newValue: WebSocket) {
            state.wbsObj = newValue;
        },
        _updateWbsStatus(state, newValue: string) {
            state.wbsStatus = newValue;
        },
        _updateWbsStatusCode(state, newValue: WbsConnectStatus) {
            state.wbsStatusCode = newValue;
        },
        _updateResponse(state, newValue: ServerWbsResponse) {
            state.res.value[newValue.h_id] = newValue;
            console.log(newValue);
        },
    },
    // Действия могут использоваться для асинхронных операций.
    actions: {
        /* Отправить запрос на сервера, в обычном режиме */
        send({ state }, { mod, h_id, body }: SendParams) {
            /*
            :::Пример отправки запроса:::

            this.$store.dispatch(`wbs/send`, {
                mod: ClientsWbsRequest_Mod.exec,
                h_id: -1,
                body: {
                    exec: "2+2",
                },
            });
            */
            state.wbsObj.send({
                mod: mod,
                h_id: h_id,
                body: body,
            });
        },
        /* Отправить запрос на сервера, в наглом режиме */
        send_force({ state }, { mod, h_id, body }: SendParams) {
            /*
            :::Пример отправки запроса:::

            this.$store.dispatch(`wbs/send`, {
                mod: ClientsWbsRequest_Mod.exec,
                h_id: -1,
                body: {
                    exec: "2+2",
                },
            });

            */
            state.wbsObj.send_force({
                mod: mod,
                h_id: h_id,
                body: body,
            });
        },
        /* Отправить как зависимости */
        send_dependent({ state }, { mod, h_id, body }: SendParams) {
            state.wbsObj.send_dependent({
                mod: mod,
                h_id: h_id,
                body: body,
            });
        },
        /* Отправить в транзакции */
        send_transaction(
            { state },
            { mod, h_id, body, rollback }: SendParamsTransaction
        ) {
            state.wbsObj.send_transaction(
                {
                    mod: mod,
                    h_id: h_id,
                    body: body,
                },
                rollback
            );
        },
        /* Инициализация Web Socket */
        initWebSocket(
            { commit, dispatch },
            { after_connect = <CallableFunction>undefined }
        ) {
            commit(
                "_updateWbsObj",
                new Wbs(token, {
                    host: host,
                    port: port,
                    callback_onopen: () => {
                        after_connect();
                    },
                    callback_onmessage: (response: ServerWbsResponse) => {
                        dispatch("_handleResponseFormServer", response);
                    },
                    callback_onclose: () => {},
                    callback_onerror: (event) => {},
                    event_connect: () => {},
                    event_error_connect: () => {},
                    callback_update_status: (
                        status_code: WbsConnectStatus,
                        status_text: string
                    ) => {
                        dispatch("_onUpdateStatus", {
                            status_code,
                            status_text,
                        });
                    },
                })
            );
        },
        /* Обработка ответа от сервера */
        _handleResponseFormServer({ commit }, response: ServerWbsResponse) {
            try {
                if (response.response != "") {
                    response.response = JSON.parse(response.response);
                }
                commit("_updateResponse", response);
            } catch (e) {
                console.error(
                    `Не удалось конвертировать в Json: state.responseRaw.value`
                );
                console.error(response);
            }
        },
        /* Обработка изменения статуса подключения к Web Socket */
        _onUpdateStatus(
            { commit },
            { status_code = <WbsConnectStatus>0, status_text = <string>"" } = {}
        ) {
            commit("_updateWbsStatusCode", status_code);
            commit("_updateWbsStatus", status_text);
        },
    },
    // Локальное пространство имен. Позволяет обращаться к мутации через `ИмяМодуляХранилища/ФункцияМутации`
    namespaced: true,
};
