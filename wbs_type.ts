export interface DT_HelpAllowed {
    /*AUTO_GEN:2022-11-13 20:31:52.891059

    Структура подсказки доступной функции
    	
*/
    //  Аннотация типов
    annotations: string;
    //  Документация в начале в тройных кавычках
    doc: string;
    //  Имя функции
    name: string;
    //  Полный путь к функции(Класс.ИмяФункции)
    qualname: string;
}
export enum WbsCloseStatus {
    /*AUTO_GEN:2022-11-13 20:31:52.891125
	
*/
    //  https://github.com/Luka967/websocket-close-codes

    //  Нормальное закрытие
    normal = 1000,
    //  Покидание страницы, клиент закрыл вкладку
    lose_clients = 1001,
    //  Слишком большой ответ от сервера
    big_response = 1009,
    //  Зарыть соединение по причине ошибки внутренней сервера
    server_error = 1011,
    //  Закрыть соединение по причине перезагрузки сервера
    server_reload = 1012,
    //  Закрыть соединение с серверов чтобы потом снова его открыть
    server_again = 1013,
    //  Ошибка в TSL рукопожатие
    tls_error = 1015,
    //  4000-4999 Свободные коды

    //  Ошибка аутентификации
    authentication_error = 4001,
    // Разрыв соединения для подключения к другому url
    disconnect_then_reconnect_new_url = 4002,
}
export enum ClientsWbsRequest_Mod {
    /*AUTO_GEN:2022-11-13 20:31:52.891147

    Модификации для запроса
    	
*/
    //  ClientsWbsRequest_GetInfoServer - Доступные функция для вызова
    info = 1,
    //  ClientsWbsRequest_AllowedFunc - Вызов доступной функции
    func = 2,
    //  ClientsWbsRequest_ExeCommand - Выполнить произвольную команду
    exec = 3,
    //  ClientsWbsRequest_ImportFromServer - Импорт на сервер указанных библиотек
    import_from_server = 4,
    //  ClientsWbsRequest_CreateSubscribe - Клиент создает событие
    event_create = 5,
    //  ClientsWbsRequest_SubscribeEvent - Клиент подписывается на событие
    event_sub = 6,
    //  ClientsWbsRequest_UnSubscribeEvent - Клиент подписывается на событие
    event_unsub = 7,
    //  ClientsWbsRequest_CacheAddKey - Записать пользовательский кеш по ключу
    cache_add_key = 8,
    //  ClientsWbsRequest_CacheReadKey - Прочитать пользовательский кеш по ключу
    cache_read_key = 9,
}
export enum ClientsWbsRequest_ModAlternatives {
    /*AUTO_GEN:2022-11-13 20:31:52.891166

    Альтернативные модификации для запроса, будут использоваться для замены модификаций `ClientsWbsRequest_Mod`
    на более специфичные
    	
*/
    //  Выполнить процедуру в режиме транзакции (ClientsWbsRequest_AllowedFunc)
    transaction_func = 101,
}
export interface ClientsWbsRequest_ImportFromServer {
    /*AUTO_GEN:2022-11-13 20:31:52.891172

    Импорт на сервер указанных библиотек
    	
*/
    //  Список библиотек
    import_sts_exe: string;
}
export interface ClientsWbsRequest_AllowedFunc {
    /*AUTO_GEN:2022-11-13 20:31:52.891180

    Исполнение разрешенных функций
    	
*/
    //  Какую функцию выполнить
    n_func: string;
    //  Позиционные аргументы
    args: any[] | undefined;
    //  Именованные аргументы
    kwargs: object | undefined;
}
export interface ClientsWbsRequest_CreateSubscribe {
    /*AUTO_GEN:2022-11-13 20:31:52.891197

    Клиент создает событие на сервере
    	
*/
    //  Имя события на которое подписываетесь
    n_func: string;
    //  Модификация события,

    //  например если нужно выполнить одну и туже функцию, но с разными

    //  аргументами.
    mod: string;
    //  Позиционные аргументы
    args: any[] | undefined;
    //  Именованные аргументы
    kwargs: object | undefined;
}
export interface ClientsWbsRequest_SubscribeEvent {
    /*AUTO_GEN:2022-11-13 20:31:52.891213

    Клиент подписывается на существующие события сервера
    	
*/
    //  Имя события на которое подписываетесь
    n_func: string;
    //  Модификация события,

    //  например если нужно выполнить одну и туже функцию, но с разными

    //  аргументами.
    mod: string;
}
export interface ClientsWbsRequest_UnSubscribeEvent {
    /*AUTO_GEN:2022-11-13 20:31:52.891221

    Клиент отписывается от события на сервере
    	
*/
    //  Имя события от которого отписываетесь
    n_func: string;
    //  Модификация события,

    //  например если нужно выполнить одну и туже функцию, но с разными

    //  аргументами.
    mod: string;
}
export interface ClientsWbsRequest_CacheAddKey {
    /*AUTO_GEN:2022-11-13 20:31:52.891230

    Записать пользовательский кеш по ключу
    	
*/
    //  Пользователь
    user: string;
    //  Ключ
    key: string;
    //  Значение
    value: string;
}
export interface ClientsWbsRequest_CacheReadKey {
    /*AUTO_GEN:2022-11-13 20:31:52.891239

    Прочитать пользовательский кеш по ключу
    	
*/
    //  Пользователь
    user: string;
    //  Ключ
    key: string;
}
export interface ClientsWbsRequest_ExeCommand {
    /*AUTO_GEN:2022-11-13 20:31:52.891247

    Исполнение произвольной команды
    	
*/
    //  Произвольная команда на языке Python, которая выполниться на сервера.
    exec: string;
}
export enum ClientsWbsRequest_GetInfoServer_id {
    /*AUTO_GEN:2022-11-13 20:31:52.891252
	
*/
    //  Получить список доступных функций
    help_allowed = 1,
    //  Проверка токена
    check_token = 2,
    //  Получить информацию о запущенных "событий сервера"
    info_event = 3,
}
export interface ClientsWbsRequest_GetInfoServer {
    /*AUTO_GEN:2022-11-13 20:31:52.891260

    Получить информацию о сервере
    	
*/
    //  ID информационной команды
    id_r: ClientsWbsRequest_GetInfoServer_id;
    //  Текст для информационной команды
    text: string | undefined;
}
export interface ClientsWbsRequest {
    /*AUTO_GEN:2022-11-13 20:31:52.891282

    Запрос клиента, для сервера
    	
*/
    //  Модификации для запроса.
    mod: ClientsWbsRequest_Mod | ClientsWbsRequest_ModAlternatives;
    //  Нужен для того чтобы можно было разными способами обрабатывать ответ на

    //  стороне клиента.
    h_id: number;
    //  Идентификатор команды, нужен если используется асинхронность
    uid_c: number;
    //  Тело запроса
    body:
        | ClientsWbsRequest_ExeCommand
        | ClientsWbsRequest_GetInfoServer
        | ClientsWbsRequest_ImportFromServer
        | ClientsWbsRequest_CreateSubscribe
        | ClientsWbsRequest_AllowedFunc
        | ClientsWbsRequest_CacheAddKey
        | ClientsWbsRequest_CacheReadKey;
    //  Время отправки сообщения от клиента в UNIX формате.
    t_send: number;
}
export enum WbsResponseCode {
    /*AUTO_GEN:2022-11-13 20:31:52.891350

    Список кодов ответа
    	
*/
    //  Ошибка валидации запроса от клиента
    error_parse_request_clients = 100,
    //  Ошибка выполнения команды на стороне сервера
    error_server = 101,
    //  Ошибка аутентификации по токену
    token_error = 102,
    //  Успешное выполнение
    ok = 200,
    //  Сообщение в качестве уведомления
    notify = 201,
    //  Произошел откат транзакции, по причине клиента(например превышено время

    //  ожидания ответа)
    rollback_from_clients = 401,
    //  Произошел откат транзакции, по причине сервера
    rollback_from_server = 402,
}
export interface ServerWbsResponse {
    /*AUTO_GEN:2022-11-13 20:31:52.891365

    Ответ от сервера, для клиента
    	
*/
    //  Нужен для того чтобы можно было разными способами обрабатывать ответ на

    //  стороне клиента.
    h_id: number;
    //  Идентификатор команды, нужен если используется асинхронность
    uid_c: number;
    //  Код ответа
    code: WbsResponseCode;
    //  Время отправки сообщения от клиента в UNIX формате.
    t_send: number;
    //  Время выполнения(t_send из запроса - t_send из ответа), заполняется на

    //  стороне клиента.
    t_exec: number;
    //  Текст ошибки
    error: string;
    //  Ответ
    response: string;
}
