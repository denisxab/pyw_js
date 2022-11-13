import {
    ClientsWbsRequest_AllowedFunc,
    ClientsWbsRequest_ExeCommand,
    ClientsWbsRequest_GetInfoServer,
    ClientsWbsRequest_ImportFromServer,
    ServerWbsResponse,
    WbsResponseCode,
    ClientsWbsRequest,
    WbsCloseStatus,
    ClientsWbsRequest_GetInfoServer_id,
    ClientsWbsRequest_ModAlternatives,
    ClientsWbsRequest_Mod,
    ClientsWbsRequest_CacheAddKey,
    ClientsWbsRequest_CreateSubscribe,
    ClientsWbsRequest_CacheReadKey,
} from "./wbs_type";
/* ------------------------------------------------------------------ */

const ClientsWbsRequest_Mod_ = ClientsWbsRequest_Mod;
const ClientsWbsRequest_ModAlternatives_ = ClientsWbsRequest_ModAlternatives;
const WbsResponseCode_ = WbsResponseCode;
/* ------------------------------------------------------------------ */

type T_callback_onopen = (event?: MessageEvent) => void;
type T_callback_onmessage = (event: MessageEvent) => void;
type T_callback_onclose = (event: CloseEvent) => void;
type T_callback_onerror = (event: Event) => void;
type T_event_connect = () => void;
type T_event_error_connect = () => void;
type T_TimeoutID = number;

/* Статусы подключения по WebSocket */
export enum WbsConnectStatus {
    // WebSocket подключен
    connect = 1,
    // WebSocket подключается
    wait_connect = 2,
    // WebSocket ошибка подключения
    error_connect = 3,
}

/* Аргументы в функцию для отправки сообщения */
export interface SendParams {
    //  Модификации для запроса.
    mod: ClientsWbsRequest_Mod | ClientsWbsRequest_ModAlternatives;
    //  Нужен для того чтобы можно было разными способами обрабатывать ответ на стороне клиента.
    h_id: number;
    //  Идентификатор команды, следующая команда с таким uid не выполниться пока не выполнилась текущая.
    uid_c?: number | undefined;
    //  Тело запроса
    body:
        | ClientsWbsRequest_ExeCommand
        | ClientsWbsRequest_GetInfoServer
        | ClientsWbsRequest_ImportFromServer
        | ClientsWbsRequest_CreateSubscribe
        | ClientsWbsRequest_AllowedFunc
        | ClientsWbsRequest_CacheAddKey
        | ClientsWbsRequest_CacheReadKey;
}
/* ---------------------- Для транзакций  -------------------------------------------- */
/* Аргументы в функцию для отправки сообщения в режиме транзакции */
export interface SendParamsTransaction extends SendParams {
    rollback: TRollback;
}

/* Варианты ошибок в транзакции для функции rollback */
export enum TRollbackErrorCode {
    // Транзакция с таким uid_c уже существует.
    duplicate_uid = 1,
    // Привешено время ожидания уведомления от сервера, о том что он получил сообщение.
    timeout_notify = 2,
    // Привешено время ожидания ответа от сервера на переданную команду.
    timeout_response = 3,
    // Ошибка при выполнение на стороне севера.
    error_server = 4,
}
/* Функция отката дри возникновение ошибки в транзакции */
export type TRollback = (
    error_code: TRollbackErrorCode,
    h_id: number,
    uid_c: number,
    res_server_json: ServerWbsResponse | undefined
) => any;

/* Статусы в транзакт листе*/
export enum TTransaction_setStatus {
    create = 0,
    get_notify = 1,
    get_response = 2,
    rollback = 3,
}
/* Структура для транзакт листа */
export interface TTransaction_set {
    [key: number]: {
        status: TTransaction_setStatus;
        timeoutID_notify: T_TimeoutID;
        timeoutID_response: T_TimeoutID;
        rollback_because_error: CallableFunction;
    };
}

/* ------------------------------------------------------------------ */
/* Логика WebSocket */
// Сколько по умолчанию ждать ответ от сервера
const _timeout_ms: number = 2000;
export class Wbs {
    /*
	Пример описан в `readme.md/Интеграция/JS`
	*/
    /////////////////////////////////////////////////////
    // Множество для хранения `uid` на которые нужно обязательно получить ответ от сервера
    force_set: Set<number>;
    // Множество для хранения `uid` которые выполняются в транзакции
    transaction_dict: TTransaction_set;
    // Токен для сервера
    token: string;
    // Статус токина
    w_status: number;
    // Имя текущего пользователя
    user: string;
    /////////////////////////////////////////////////////
    // Подключение
    _wbs_connect: WebSocket;
    // Список команд которые считаются зависимостями
    _dependent_list: any[];
    // Указывает на то что было переподключение
    _is_reconnected: boolean = false;
    // Идентификатор интервала переподключения к серверу
    _idInterval_smart_connect: number = undefined;
    // Функция обновления статуса
    callback_update_status: (
        status_code: WbsConnectStatus,
        status_text: string
    ) => void | undefined;
    // Генератор дл uid_c, гарантирует уникальность uid_c
    _generator_uid_c: number;
    constructor(
        token: string,
        {
            host = <string>"localhost",
            port = <number>9999,
            callback_onopen = (event?: MessageEvent) => {},
            callback_onmessage = (response: ServerWbsResponse) => {},
            callback_onclose = (event: CloseEvent) => {},
            callback_onerror = (event: Event) => {},
            event_connect = () => {},
            event_error_connect = () => {},
            callback_update_status: callback_updateS_status = (
                status_code: WbsConnectStatus,
                status_text: string
            ) => {},
            user = "base",
        } = {}
    ) {
        /*
		token: Токен для сервера. Это обеспечивает безопасность для сервера, 
			те кто указывает не верный токен, не получают доступ к серверу,
			и заносятся во временный черный список.

		host: Хост
		port: Порт

		callback_onopen: Функция для отправки сообщений на сервер через WebSocket. Вызовется один раз при инициализации 
		callback_onmessage: Функция для получения сообщений от сервера через WebSocket. 

		callback_onclose: Функция обработка закрытия соединения с сервером.
		callback_onerror: Функция обработок ошибок при отправке на сервер.

		event_connect: Событие = Успешное подключение к серверу, будет вызываться при каждом успешном подключение. 
		event_error_connect: Событие = Не удалось подключиться к серверу.

        CallbackUpdateStatus: Функция обрабатывающая изменения статуса подключения в Web Socket

		*/
        this.force_set = new Set();
        this.transaction_dict = {};
        this.token = token;
        this.w_status = 0;
        this.user = user;
        this._generator_uid_c = 0;
        this.callback_update_status = callback_updateS_status;
        this._dependent_list = [];
        // Инициализация подключения по протоколу WebSocket к Python серверу
        let tmp_wbs = new WebSocket(`ws://${host}:${port}/`);
        // ------------------ Заранее указываем функции ----------------------
        // Функция в которой происходит отправка.
        tmp_wbs.onopen = (event) => {
            // Если это первое подключение, то отчищаем(не ждем) интервал переподключения к серверу.
            clearInterval(this._idInterval_smart_connect);
            // Обновляем статус "на подключено"
            this._update_status(
                WbsConnectStatus.connect,
                `Успешное подключение к ${this._wbs_connect.url}`
            );
            // Первым сообщением отправляем токен, для аутентификации подключения
            this._send_token();
            // Вызываем пользовательский обработчик события подключения к серверу
            if (event_connect) event_connect();
            // Вызываем пользовательскую функцию
            if (callback_onopen !== undefined)
                callback_onopen(<MessageEvent>event);
        };
        // Функция получения ответа от сервер
        tmp_wbs.onmessage = (event) => {
            let res_server_json = <ServerWbsResponse>JSON.parse(event.data);
            // Посчитать время выполнения команды(с отправки по сети)
            res_server_json.t_exec =
                this._GetCurrentTime() - res_server_json.t_send;
            // Получить uid_c из ответа сервера
            const res_uid_c: number = res_server_json.uid_c;
            // Если uid есть в `force_set`
            if (this.force_set.has(res_uid_c)) {
                // То удаляем этот uid из обязательного множества, так как это считается получением ответа от сервера
                this.force_set.delete(res_uid_c);
            }
            // Если uid есть в `transaction_dict`
            if (this.transaction_dict[res_uid_c]) {
                // Выполняем логику транзакции
                res_server_json = this._check_transaction(
                    res_uid_c,
                    res_server_json
                );
            }
            // Вызываем пользовательскую функцию если она есть
            if (callback_onmessage !== undefined)
                callback_onmessage(res_server_json);
        };
        // Обработка ошибок при отправки
        tmp_wbs.onerror = (event) => {
            if (callback_onerror !== undefined) callback_onerror(event);
        };
        // Обработка закрытия соединения
        tmp_wbs.onclose = (event: CloseEvent) => {
            /*
			# Вот как принудительно закрыть соединение
			WebsockeT.close(КодЗакрытия_1000, "СообщениеНаСерверУказывающийПричинуЗакрытия");
			*/
            // Если соединение было закрыто значит, будет переподключение
            this._is_reconnected = true;
            console.warn(`${event.code}:${event.reason}`);
            // Вызываем пользовательскую функцию.
            if (callback_onclose) {
                callback_onclose(event);
            }
            // Пытаемся переподключиться к серверу
            this._smart_connect(tmp_wbs, event_connect, event_error_connect);
        };
        this._wbs_connect = tmp_wbs;
        // Реализуем логику обработки событий "успешного" и "ошибочного" подключения к северу.
        this._smart_connect(tmp_wbs, event_connect, event_error_connect);
    }
    //
    /* Отправить сообщение */
    //
    send({ mod, h_id, uid_c, body }: SendParams) {
        // Если не указан uid_c то генерируем его.
        if (uid_c === undefined) uid_c = this.getUidC();
        // Если есть подключение то отправляем сообщение
        if (
            this._wbs_connect !== undefined &&
            this.w_status == WbsConnectStatus.connect
        ) {
            /* Пред обработка тела запроса */
            switch (mod) {
                // Добавляем имя текущего пользователя, если не указано ни какое имя
                case ClientsWbsRequest_Mod.cache_add_key:
                case ClientsWbsRequest_Mod.cache_read_key: {
                    body = <ClientsWbsRequest_CacheAddKey>body;
                    if (!body.user) {
                        body.user = this.user;
                    }
                    break;
                }
            }
            //
            // Отправка сообщения на сервер
            //
            this._wbs_connect.send(
                JSON.stringify(<ClientsWbsRequest>{
                    h_id: h_id,
                    uid_c: uid_c,
                    mod: mod,
                    body: body,
                    t_send: this._GetCurrentTime(),
                })
            );
        } else {
            console.error(
                `Сообщение "mod=${mod}" не отправленное так как нет соединения`
            );
        }
    }
    /* Принудительная отправка сообщения */
    send_force(
        { mod, h_id, uid_c, body }: SendParams,
        timeout_ms = <number>_timeout_ms
    ) {
        /*
		Сообщение отправиться на сервер, но если на него не получен ответ,
		то сообщение будут снова отправлено, 
		это будет происходить пока клиент не получит ответ на свое сообщение от сервера. 

		Другие сообщения с таким же `uid_c` не будут отправляться.

		Например это нужны на случай, если связь с сервером оборвется. 
		метод `_smart_connect` будет пытаться переподключиться к серверу,
		а это метод пытаться отправить сообщение
		*/
        // Если не указан uid_c то генерируем его.
        if (uid_c === undefined) uid_c = this.getUidC();

        if (!this.force_set.has(uid_c)) {
            this.force_set.add(uid_c);
            // Отправляем сообщение, Если есть подключение, если его нет то сообщение отправиться через интервал
            this.send({
                mod: mod,
                h_id: h_id,
                uid_c: uid_c,
                body: body,
            });

            // В любом случае запускам интервал проверки ответа на сообщение
            const idInterval = setInterval(() => {
                // Если есть подключение и на сообщение нет ответа, то отправляем его снова
                if (
                    this.w_status == WbsConnectStatus.connect &&
                    this._wbs_connect !== undefined &&
                    this.force_set.has(uid_c)
                ) {
                    // Пере отправлять сообщение, пока `uid` есть в транзакт листе.
                    // Этот `uid` должен удалиться из транзакт листа когда мы получим ответ от сервера на этот `uid`
                    this.send({
                        mod: mod,
                        h_id: h_id,
                        uid_c: uid_c,
                        body: body,
                    });
                } else {
                    // Прекратить переотправку сообщения, если `uid` нет в транзакт листе
                    clearInterval(idInterval);
                }
            }, timeout_ms);
        }
    }
    /* Сохранение команд для зависимостей и отправка их, переотправка осуществляется в `_re_send_dependent` */
    send_dependent(
        { mod, h_id, uid_c, body }: SendParams,
        timeout_ms = <number>_timeout_ms
    ) {
        /*
		Особый режим отправки сообщения. В этом режиме если вы потеряли связь с сервером
		то при восстановление связи, все сообщение которые отправлены через этот метод, будут перенаправлены.
		
		Это полезно при импорте модулей.
		*/
        // Если не указан uid_c то генерируем его.
        if (uid_c === undefined) uid_c = this.getUidC();

        const request: any = {
            mod: mod,
            uid_c: uid_c,
            d: { h_id: h_id, body: body },
            ms: timeout_ms,
        };
        this._dependent_list.push(request);
        this.send_force(
            {
                mod: request.mod,
                h_id: request.d.h_id,
                uid_c: request.uid_c,
                body: request.d.body,
            },
            request.ms
        );
    }
    /* Отправить сообщение в режиме транзакции */
    send_transaction(
        { mod, h_id, uid_c, body }: SendParams,
        rollback: TRollback,
        timeout_ms_notify = <number>_timeout_ms,
        timeout_ms_response = <number>5000
    ) {
        /*
        timeout_ms_notify: Время ожидания уведомления
        timeout_ms_response: Время ожидания ответа
        */
        // Проверяем допустимость модификации, для передачи в транзакции
        if (mod != ClientsWbsRequest_Mod_.func) {
            throw new Error(
                "Передача в режиме транзакции поддерживается только для модификации:(func_trans)"
            );
        }
        // Замена модификации на транзакционный вариант
        const alternative_mod =
            ClientsWbsRequest_ModAlternatives_.transaction_func;
        //
        //
        // Генерируем uid_c если он не передан
        if (uid_c === undefined) uid_c = this.getUidC();
        // Проверяем наличие uid_c в транзакт листе
        if (!this.transaction_dict[uid_c]) {
            //
            //
            // Добавляем uid_c в транзакт лист
            this.transaction_dict[uid_c] = {
                // Изначально статус равен "Созданию"
                status: TTransaction_setStatus.create,
                // Ждем уведомления от сервера, от том что он принял это сообщение.
                timeoutID_notify: setTimeout(() => {
                    // Если привешено ожидание уведомления, то не ожидаем результата
                    clearTimeout(
                        this.transaction_dict[uid_c].timeoutID_response
                    );
                    // Устанавливаем статус в 'rollback'
                    this.transaction_dict[uid_c].status =
                        TTransaction_setStatus.rollback;
                    // Исполняем пользовательский `rollback`
                    rollback(
                        TRollbackErrorCode.timeout_notify,
                        h_id,
                        uid_c,
                        undefined
                    );
                }, timeout_ms_notify),
                // Ждем результат команды от сервера.
                timeoutID_response: setTimeout(() => {
                    // Устанавливаем статус в 'rollback'
                    this.transaction_dict[uid_c].status =
                        TTransaction_setStatus.rollback;
                    // Исполняем пользовательский `rollback`
                    rollback(
                        TRollbackErrorCode.timeout_response,
                        h_id,
                        uid_c,
                        undefined
                    );
                }, timeout_ms_response),
                // Вызовется если при выполнение команды, произошла ошибка на стороне сервера.
                rollback_because_error: (
                    res_server_json: ServerWbsResponse
                ) => {
                    // Устанавливаем статус в 'rollback'
                    this.transaction_dict[uid_c].status =
                        TTransaction_setStatus.rollback;
                    // Исполняем пользовательский `rollback`
                    rollback(
                        TRollbackErrorCode.error_server,
                        h_id,
                        uid_c,
                        res_server_json
                    );
                },
            };
            //
            //
            // Отправляем сообщение
            this.send({
                mod: alternative_mod,
                h_id: h_id,
                uid_c: uid_c,
                body: body,
            });
        }
        // Если такой uid_c уже существует, то это дубликат, вызываем rollback
        else {
            rollback(TRollbackErrorCode.duplicate_uid, h_id, uid_c, undefined);
        }
    }
    //
    //
    //
    /* Отправляем токен на сервер */
    _send_token() {
        this.send({
            mod: ClientsWbsRequest_Mod.info,
            h_id: -1,
            uid_c: 0,
            body: {
                id_r: ClientsWbsRequest_GetInfoServer_id.check_token,
                text: this.token,
            },
        });
    }
    /* Пере отправить все зависимости */
    _again_send_dependent() {
        for (const d of this._dependent_list) {
            this.send_force(
                {
                    mod: d.mod,
                    h_id: d.d.h_id,
                    uid_c: d.uid_c,
                    body: d.d.body,
                },
                d.ms
            );
        }
    }
    /* Обновление статуса подключения, и вызвать пользовательскую функцию */
    _update_status(status_code: WbsConnectStatus, status_text: string) {
        console.info(status_text);
        this.w_status = status_code;
        if (this.callback_update_status !== undefined)
            this.callback_update_status(status_code, status_text);
    }
    //
    //
    //
    /* Закрыть соединение */
    close(code?: WbsCloseStatus, msg?: string) {
        /*
        code: Код закрытия
        msg: Сообщение серверу
		*/
        this._wbs_connect.close(code, msg);
    }
    /* Получить уникальный uid_c */
    getUidC(): number {
        return this._GeneratorUidC();
    }
    /* Логика подключения к серверу, и переподключение к нему если соединение закрыто. */
    _smart_connect(
        use_wbs: WebSocket,
        event_connect: T_event_connect | undefined,
        event_error_connect: T_event_connect | undefined,
        mc: number = 1000
    ) {
        // Проверяем соединение с сервером через указанное количество миллисекунд
        // Если соединение не удалось, то пытаемся еще раз подключиться к серверу
        // Также вызываем пользовательские обработчики событий "успешного" и "ошибочного" подключения.
        this._idInterval_smart_connect = setInterval(() => {
            this._update_status(
                WbsConnectStatus.wait_connect,
                `Попытка подключится к ${this._wbs_connect.url} > ${this._wbs_connect.readyState}`
            );
            // Не удалось подключится
            if (
                this._wbs_connect.readyState === WbsConnectStatus.error_connect
            ) {
                this._update_status(
                    WbsConnectStatus.error_connect,
                    `Не удалось подключиться к ${
                        this._wbs_connect.url
                    } ${nowTime()}`
                );
                if (event_error_connect) event_error_connect();
                // Переподключиться
                this._wbs_connect = new WebSocket(this._wbs_connect.url);
            }
            // Успешное подключение
            else if (
                this._wbs_connect.readyState === WbsConnectStatus.connect
            ) {
                this._update_status(
                    WbsConnectStatus.connect,
                    `Успешное подключение к ${this._wbs_connect.url}`
                );
                // Восстанавливаем функции которе были от пользователя
                this._wbs_connect.onopen = use_wbs.onopen;
                this._wbs_connect.onmessage = use_wbs.onmessage;
                this._wbs_connect.onerror = use_wbs.onerror;
                this._wbs_connect.onclose = use_wbs.onclose;
                // Отправляем первым сообщением токен, если это переподключение(не Первое подключение)
                if (this._is_reconnected) this._send_token();
                // Вызываем пользовательский обработчик события подключения к серверу
                if (event_connect) event_connect();
                // Пере отправить зависимости, если это переподключение
                if (this._is_reconnected) this._again_send_dependent();
                // Прекращаем переподключение
                clearInterval(this._idInterval_smart_connect);
            }
        }, mc);
    }
    /* Создать уникальный uid_c */
    _GeneratorUidC() {
        // Сбрасывать генератор если он дошел до максимального числа.
        this._generator_uid_c =
            (this._generator_uid_c + 1) % Number.MAX_SAFE_INTEGER;
        return this._generator_uid_c;
    }

    /* Получить текущие время в UNIX */
    _GetCurrentTime() {
        return new Date().getTime() / 1000;
    }

    /* Обработка ответа в режиме транзакции */
    _check_transaction(
        res_uid_c: number,
        res_server_json: ServerWbsResponse
    ): ServerWbsResponse {
        // Статус транзакции
        const status: TTransaction_setStatus =
            this.transaction_dict[res_uid_c].status;
        // Обработка статуса
        switch (status) {
            // Если это сообщение только создано, и ответ в статусе "уведомления"
            case TTransaction_setStatus.create: {
                if (res_server_json.code == WbsResponseCode_.notify) {
                    // Прекращаем ожидания уведомления
                    clearTimeout(
                        this.transaction_dict[res_uid_c].timeoutID_notify
                    );
                    // Меняем статус сообщения на "Полученное уведомление"
                    this.transaction_dict[res_uid_c].status =
                        TTransaction_setStatus.get_notify;
                }
                break;
            }
            // Если сообщение ожидает результата от сервера, на свою команду.
            case TTransaction_setStatus.get_notify: {
                // И ответ сервера успешный.
                if (res_server_json.code == WbsResponseCode_.ok) {
                    // Прекращаем ожидания результата
                    clearTimeout(
                        this.transaction_dict[res_uid_c].timeoutID_response
                    );
                    // Меняем статус сообщение на "Получен результат"
                    this.transaction_dict[res_uid_c].status =
                        TTransaction_setStatus.get_response;
                    // Удаляем из транзакт листа
                    delete this.transaction_dict[res_uid_c];
                }
                // Если во время выполнения команды, произошла ошибка на стороне сервера.
                else if (
                    [
                        WbsResponseCode_.error_server,
                        WbsResponseCode_.error_parse_request_clients,
                    ].includes(res_server_json.code)
                ) {
                    // Прекращаем ожидания результата
                    clearTimeout(
                        this.transaction_dict[res_uid_c].timeoutID_response
                    );
                    // Меняем код ответа сервера, на откат, по причине сервера.
                    res_server_json.code =
                        WbsResponseCode_.rollback_from_server;
                    // Выполняем rollback
                    this.transaction_dict[res_uid_c].rollback_because_error(
                        res_server_json.error
                    );
                    // Удаляем из транзакт листа
                    delete this.transaction_dict[res_uid_c];
                } else {
                    alert("Не поддерживаемый статус ответа на транзакцию");
                }
                break;
            }
            case TTransaction_setStatus.rollback: {
                // Если транзакция в статусе отката(`rollback`) по причине клиента, например время ожидания превышено
                const msg =
                    "Произошел `rollback` транзакции, по причине клиента";
                res_server_json.code = WbsResponseCode_.rollback_from_clients;
                res_server_json.error = msg;
                console.error(msg);
                break;
            }
            default: {
                console.log("Ошибка статуса транзакции");
            }
        }
        return res_server_json;
    }
}
//
// -------------  Утилиты ------------------------------------
//
/* Получить текущие время */
function nowTime(): string {
    const current_date = new Date();
    return (
        current_date.getDate() +
        "/" +
        (current_date.getMonth() + 1) +
        "/" +
        current_date.getFullYear() +
        " @ " +
        current_date.getHours() +
        ":" +
        current_date.getMinutes() +
        ":" +
        current_date.getSeconds()
    );
}

/* Класс для создания объекта в котором будут храниться псевдонимы на h_id */
export class ClassHID {
    /*
    Для получения h_id по псевдониму
    >obj.names.Псевдоним
    Для получения псевдонима по h_id 
    >obj.ids.Псевдоним
    */
    // Хранит псевдонимы и указывает на h_id
    names: { [key: string]: number } = {};
    // Хранит h_id и указывает на псевдонимы
    ids: { [key: number]: string } = {};
    constructor(args_name: { [key: string]: number }) {
        for (const i in args_name) {
            this.names[i] = args_name[i];
            this.ids[args_name[i]] = i;
        }
    }
}
