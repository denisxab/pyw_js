# Вся документация

в https://github.com/denisxab/py_wjs

## Подключить тестовый стенд во Vue CLI

1. Файл `vue.config.js`

    ```ts
    const { defineConfig } = require("@vue/cli-service");
    const path = require("path");

    module.exports = {
        ...defineConfig({
            transpileDependencies: true,
        }),
        configureWebpack: {
            resolve: {
                alias: {
                    wbs: path.resolve("/Путь/pyw_js/"),
                },
            },
        },
    };
    ```

2. Файл `tsconfig.json`

    ```json
    {
        "compilerOptions": {
            "paths": {
                "wbs/*": ["/Путь/pyw_js/*"]
            }
        }
    }
    ```

3. Файл `store/index.ts`

    ```ts
    import { createStore } from "vuex";
    import { wbsStore } from "wbs/vue/wbsStore";

    export default createStore({
        modules: { wbs: wbsStore },
    });
    ```

4. Файл `main.ts`

    ```ts
    import { createApp } from "vue";
    import App from "wbs/vue/test_stend/App.vue";
    import store from "./store";
    const app = createApp(App);

    app.use(store).mount("#app");
    ```
