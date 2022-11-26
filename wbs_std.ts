/*
Функция для решения стандартный задач, которые возникают при создание десктопных программ 
*/

export function getPath(default_path: string): string {
    /*
    Получить путь к запущенному `HTML` файлу.
    */
    // Такой адрес у url сервера в режиме разработчика, в этом случаи не получиться получить
    // Путь к `html` файлу, и нужно укзать
    if (window.location.pathname == "/") {
        return default_path;
    }
    /* Путь до папки с символьными файлами */
    let pathDirLinks_ = window.location.pathname.split(/[\/]/g).slice(0, -1);
    let pathDirLinks = "";
    if (window.location.pathname.search(/\\/g) >= 0) {
        // Windows Файловая система
        pathDirLinks = pathDirLinks_.join("\\") + "\\raw";
    } else {
        // UNIX файловая система
        pathDirLinks = pathDirLinks_.join("/") + "/raw";
    }
    return pathDirLinks;
}
