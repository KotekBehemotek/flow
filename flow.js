class Flow {
    #state;
    #lastState;
    #displayDependencies = new Map;
    #displayDependenciesKey = 0;
    #styleDependencies = new Map;
    #styleDependenciesKey = 0;
    #listenerDependencies = new Map;
    #listenerDependenciesKey = 0;
    #functionsDependencies = new Map;
    #functionsDependenciesKey = 0;
    #idElements = new Map;
    #classElements = new Map;
    #tagElements = new Map;
    #queue = [];
    #enter;
    #exit;

    constructor() {
    }

    set state(state) {
        this.#lastState = this.#state;
        this.#state = state;
        this.#executeDependencies();
    }

    get state() {
        return this.#state;
    }

    set enter(enter) {
        this.#enter = enter;
    }

    get enter() {
        return this.#enter;
    }

    set exit(exit) {
        this.#exit = exit;
        window.addEventListener('beforeunload', exit);
    }

    get exit() {
        return this.#exit;
    }

    registerDisplayDependency(displayData) {
        const toReturn = [];

        displayData.forEach(value => {
            this.#displayDependencies.set(this.#displayDependenciesKey, value);
            toReturn.push(this.#displayDependenciesKey);
            this.#displayDependenciesKey++;
        });

        this.#executeDisplayDependencies();
        return toReturn;
    }

    registerStyleDependency(styleData) {
        const toReturn = [];

        styleData.forEach(value => {
            this.#styleDependencies.set(this.#styleDependenciesKey, value);
            toReturn.push(this.#styleDependenciesKey);
            this.#styleDependenciesKey++;
        });

        this.#executeStyleDependencies();
        return toReturn;
    }

    registerListenerDependency(listenerData) {
        const toReturn = [];

        listenerData.forEach(value => {
            this.#listenerDependencies.set(this.#listenerDependenciesKey, value);
            toReturn.push(this.#listenerDependenciesKey);
            this.#listenerDependenciesKey++;
        });

        this.#executeListenerDependencies();
        return toReturn;
    }

    registerFunctionDependency(functionData) {
        const toReturn = [];

        functionData.forEach(value => {
            this.#functionsDependencies.set(this.#functionsDependenciesKey, value);
            toReturn.push(this.#functionsDependenciesKey);
            this.#functionsDependenciesKey++;
        });

        this.#executeFunctionDependencies();
        return toReturn;
    }

    getByID(id) {
        const elementInMemory = this.#idElements.get(id);

        if (elementInMemory === undefined) {
            const element = document.getElementById(id);
            this.#idElements.set(id, element);
            return element;
        } else {
            return elementInMemory;
        }
    }

    getByClass(clas) {
        const elementsInMemory = this.#classElements.get(clas);

        if (elementsInMemory === undefined) {
            const elements = document.getElementsByClassName(clas);
            this.#classElements.set(clas, elements);
            return elements;
        } else {
            return elementsInMemory;
        }
    }

    getByTag(tag) {
        const elementsInMemory = this.#tagElements.get(tag);

        if (elementsInMemory === undefined) {
            const elements = document.getElementsByTagName(tag);
            this.#tagElements.set(tag, elements);
            return elements;
        } else {
            return elementsInMemory;
        }
    }

    scheduleNewJob(func, params) {
        this.#queue.push([func, params]);

        if (this.#queue.length === 1) {
            func?.(params);
        }
    }

    registerJobDone() {
        this.#queue.shift();

        if (this.#queue.length > 0) {
            const firstIndex = this.#queue[0];
            firstIndex[0]?.(firstIndex[1]);
        }
    }

    #executeDisplayDependencies() {
        this.#displayDependencies.forEach(({state, element, display}) => {
            const reason = this.#searchForReason(state);

            if (reason[0] && element !== null) {
                if (reason[1]) {
                    HTMLCollection.prototype.isPrototypeOf(element) ?
                        [...element].forEach(value => value.style.display = display) :
                        element.style.display = display;
                } else {
                    HTMLCollection.prototype.isPrototypeOf(element) ?
                        [...element].forEach(value => value.style.display = 'none') :
                        element.style.display = 'none';
                }
            }
        });
    }

    #executeStyleDependencies() {
        this.#styleDependencies.forEach(({state, element, style}) => {
            const reason = this.#searchForReason(state);

            if (reason[0] && element !== null) {
                const elementStyleText = element.style.cssText;

                if (reason[1]) {
                    HTMLCollection.prototype.isPrototypeOf(element) ?
                        [...element].forEach(value => value.style.cssText = elementStyleText + style) :
                        element.style.cssText = elementStyleText + style;
                } else {
                    HTMLCollection.prototype.isPrototypeOf(element) ?
                        [...element].forEach(value => value.style.cssText = elementStyleText.replace(style, '')) :
                        element.style.cssText = elementStyleText.replace(style, '');
                }
            }
        });
    }

    #executeListenerDependencies() {
        this.#listenerDependencies.forEach(({state, target, type, fn}) => {
            const reason = this.#searchForReason(state);

            if (reason[0] && this.#lastState !== undefined && target !== null) {
                if (reason[1]) {
                    HTMLCollection.prototype.isPrototypeOf(target) ?
                        [...target].forEach(value => value.addEventListener(type, fn)) :
                        target.addEventListener(type, fn);
                } else {
                    HTMLCollection.prototype.isPrototypeOf(target) ?
                        [...target].forEach(value => value.removeEventListener(type, fn)) :
                        target.removeEventListener(type, fn);
                }
            }
        });
    }

    #executeFunctionDependencies() {
        this.#functionsDependencies.forEach(({state, fn}) => {
            if (this.#searchForReason(state)[1]) {
                fn?.();
            }
        })
    }

    #searchForReason(states) {
        const toReturn = [];
        let currentMatch = false,
            lastMatch = false;

        states.forEach(value => {
            if (value === this.#state) {
                currentMatch = true;
            }
            if (value === this.#lastState) {
                lastMatch = true;
            }
        });

        this.#lastState === undefined ?
            toReturn[0] = true :
            toReturn[0] = currentMatch !== lastMatch;
        toReturn[1] = currentMatch;

        return toReturn;
    }

    #executeDependencies() {
        this.#executeDisplayDependencies();
        this.#executeStyleDependencies();
        this.#executeListenerDependencies();
        this.#executeFunctionDependencies();
    }

    removeDisplayDependency(key) {
        this.#displayDependencies.delete(key);
    }

    removeStyleDependency(key) {
        this.#styleDependencies.delete(key);
    }

    removeListenerDependency(key) {
        this.#listenerDependencies.delete(key);
    }

    removeFunctionDependency(key) {
        this.#functionsDependencies.delete(key);
    }
}

export default Flow;