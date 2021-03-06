import { options, noop, innerHTML } from "./util";
import { removeDOMElement } from "./browser";

export function disposeVnode(vnode) {
    if (!vnode || vnode._disposed) {
        return;
    }
    disposeStrategy[vnode.vtype](vnode);
    vnode._disposed = true;
}
var disposeStrategy = {
    0: noop,
    1: disposeElement,
    2: disposeComponent,
    4: disposeStateless
};
function disposeStateless(vnode) {
    var instance = vnode._instance;
    if (instance) {
        disposeVnode(instance.__rendered);
        vnode._instance = null;
    }
}

function disposeElement(vnode) {
    var { props, vchildren } = vnode;
    if (vnode.ref) {
        vnode.ref(null);
        delete vnode.ref;
    }
    if (props[innerHTML]) {
        removeDOMElement(vnode._hostNode);
    } else {
        for (let i = 0, n = vchildren.length; i < n; i++) {
            disposeVnode(vchildren[i]);
        }
    }
}

function disposeComponent(vnode) {
    let instance = vnode._instance;
    if (instance) {
        options.beforeUnmount(instance);
        let dom = instance.__dom;
        instance.__current = instance.setState = instance.forceUpdate = noop;
        if (vnode.ref) {
            vnode.ref(null);
        }
        if (instance.componentWillUnmount) {
            instance.componentWillUnmount();
        }
        //在执行componentWillUnmount后才将关联的元素节点解绑，防止用户在钩子里调用 findDOMNode方法
        if (dom) {
            dom.__component = null;
        }
       
        vnode.ref = instance.__dom = vnode._instance = null;
        disposeVnode(instance.__rendered);
    }
}
