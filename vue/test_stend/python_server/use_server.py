import asyncio
from pathlib import Path

from wbs.wbs_server import wbs_main_loop
from wbs.wbs_handle import WbsHandle
from explorer_user import MyWbsFunc, MyWbsSubscribe

from logsmal import logger


class UserWbsHandle(WbsHandle):
    # Разрешенные функции
    allowed_func = MyWbsFunc
    # Обработка событий на сервере
    allowed_subscribe = MyWbsSubscribe
    # Разрешенные токены подключения
    allowed_token = set(['sysdba'])
    #
    # Настройки логера. Используется https://pypi.org/project/logsmal/
    #
    # Путь к лог файлам.
    path_log = Path(__file__).parent / Path('log')
    # Обновление настроек логера, чтобы они также записывали сообщения в файл
    logger.success = logger.success.updateCopy(
        fileout=(path_log / 'info.log'), console_out=True, max_len_console=64
    )
    logger.info = logger.info.updateCopy(
        fileout=(path_log / 'info.log'), console_out=True, max_len_console=64
    )
    logger.debug = logger.debug.updateCopy(
        fileout=(path_log / 'info.log'), console_out=True, max_len_console=64
    )
    logger.error = logger.error.updateCopy(
        fileout=(path_log / 'error.log'), console_out=True, max_len_console=64
    )
    # Определяем логер
    logger = logger


host = "localhost"
port = 9999

if __name__ == '__main__':
    asyncio.run(wbs_main_loop(host, port, UserWbsHandle))
