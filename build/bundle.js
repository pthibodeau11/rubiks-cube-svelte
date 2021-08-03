
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function fix_and_destroy_block(block, lookup) {
        block.f();
        destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next, lookup.has(block.key));
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Nav.svelte generated by Svelte v3.22.1 */

    const file = "src/Nav.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h4;
    	let t2;
    	let h1;
    	let t4;
    	let div2;
    	let li0;
    	let t6;
    	let li1;
    	let t8;
    	let li2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Guide:";
    			t2 = space();
    			h1 = element("h1");
    			h1.textContent = "How to Solve a Rubik's Cube";
    			t4 = space();
    			div2 = element("div");
    			li0 = element("li");
    			li0.textContent = "Home";
    			t6 = space();
    			li1 = element("li");
    			li1.textContent = "Timer";
    			t8 = space();
    			li2 = element("li");
    			li2.textContent = "Purchase Cube";
    			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "rubik gif");
    			attr_dev(img, "class", "svelte-1u0f9b6");
    			add_location(img, file, 14, 8, 210);
    			attr_dev(h4, "class", "svelte-1u0f9b6");
    			add_location(h4, file, 18, 12, 299);
    			attr_dev(h1, "class", "svelte-1u0f9b6");
    			add_location(h1, file, 19, 12, 327);
    			attr_dev(div0, "class", "Title svelte-1u0f9b6");
    			add_location(div0, file, 15, 8, 246);
    			attr_dev(div1, "class", "TitleContainer svelte-1u0f9b6");
    			add_location(div1, file, 11, 4, 160);
    			attr_dev(li0, "class", "svelte-1u0f9b6");
    			add_location(li0, file, 25, 8, 438);
    			attr_dev(li1, "class", "svelte-1u0f9b6");
    			add_location(li1, file, 26, 8, 495);
    			attr_dev(li2, "class", "svelte-1u0f9b6");
    			add_location(li2, file, 27, 8, 554);
    			attr_dev(div2, "class", "NavLinks svelte-1u0f9b6");
    			add_location(div2, file, 22, 4, 394);
    			attr_dev(div3, "class", "NavBar svelte-1u0f9b6");
    			add_location(div3, file, 8, 0, 130);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(div0, t2);
    			append_dev(div0, h1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, li0);
    			append_dev(div2, t6);
    			append_dev(div2, li1);
    			append_dev(div2, t8);
    			append_dev(div2, li2);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(li0, "click", /*click_handler*/ ctx[3], false, false, false),
    				listen_dev(li1, "click", /*click_handler_1*/ ctx[4], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let src = "./images/rubik_gif.gif";
    	let { page = "Home" } = $$props;

    	function setPage(i) {
    		$$invalidate(2, page = i);
    	}

    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nav", $$slots, []);
    	const click_handler = () => setPage("Home");
    	const click_handler_1 = () => setPage("Timer");

    	$$self.$set = $$props => {
    		if ("page" in $$props) $$invalidate(2, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({ src, page, setPage });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("page" in $$props) $$invalidate(2, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, setPage, page, click_handler, click_handler_1];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { page: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get page() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltecasts/svelte-youtube/src/index.svelte generated by Svelte v3.22.1 */
    const file$1 = "node_modules/@sveltecasts/svelte-youtube/src/index.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", /*divId*/ ctx[0]);
    			add_location(div0, file$1, 68, 2, 1955);
    			attr_dev(div1, "class", "yt-component");
    			add_location(div1, file$1, 67, 0, 1926);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let YouTubeIframeAPIReady = false;

    function isMyScriptLoaded(url = "") {
    	var scripts = document.getElementsByTagName("script");

    	for (var i = scripts.length; i--; ) {
    		if (scripts[i].src == url) return true;
    	}

    	return false;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let player;
    	const dispatch = createEventDispatcher();
    	let divId = "player_" + parseInt(Math.random() * 100000).toString();
    	let { videoId } = $$props;
    	let { height = "390" } = $$props;
    	let { width = "640" } = $$props;

    	onMount(() => {
    		let ytTagUrl = "https://www.youtube.com/iframe_api";

    		if (!isMyScriptLoaded(ytTagUrl)) {
    			// 2. This code loads the IFrame Player API code asynchronously.
    			var tag = document.createElement("script");

    			tag.src = ytTagUrl;
    			var firstScriptTag = document.getElementsByTagName("script")[0];
    			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    		}

    		window.onYouTubeIframeAPIReady = function () {
    			//console.log('hello')
    			window.dispatchEvent(new Event("YouTubeIframeAPIReady"));
    		};

    		window.addEventListener("YouTubeIframeAPIReady", function () {
    			if (YouTubeIframeAPIReady == false) {
    				// first load of an YT Video on this project
    				YouTubeIframeAPIReady = true; // now the Player can be created

    				createPlayer();
    			}
    		});

    		function createPlayer() {
    			player = new YT.Player(divId,
    			{
    					height,
    					width,
    					videoId,
    					events: {
    						//'onReady': onPlayerReady,
    						onStateChange: onPlayerStateChange
    					}
    				});
    		}

    		if (YouTubeIframeAPIReady) {
    			createPlayer(); // if the YT Script is ready, we can create our player
    		}
    	});

    	function onPlayerStateChange({ data }) {
    		dispatch("StateChange", data);
    	}

    	function playVideo() {
    		player.playVideo();
    	}

    	const writable_props = ["videoId", "height", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Src> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Src", $$slots, []);

    	$$self.$set = $$props => {
    		if ("videoId" in $$props) $$invalidate(1, videoId = $$props.videoId);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({
    		YouTubeIframeAPIReady,
    		player,
    		createEventDispatcher,
    		onMount,
    		dispatch,
    		divId,
    		videoId,
    		height,
    		width,
    		isMyScriptLoaded,
    		onPlayerStateChange,
    		playVideo
    	});

    	$$self.$inject_state = $$props => {
    		if ("player" in $$props) player = $$props.player;
    		if ("divId" in $$props) $$invalidate(0, divId = $$props.divId);
    		if ("videoId" in $$props) $$invalidate(1, videoId = $$props.videoId);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [divId, videoId, height, width, playVideo];
    }

    class Src extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			videoId: 1,
    			height: 2,
    			width: 3,
    			playVideo: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Src",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*videoId*/ ctx[1] === undefined && !("videoId" in props)) {
    			console.warn("<Src> was created without expected prop 'videoId'");
    		}
    	}

    	get videoId() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set videoId(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get playVideo() {
    		return this.$$.ctx[4];
    	}

    	set playVideo(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Steps.svelte generated by Svelte v3.22.1 */
    const file$2 = "src/Steps.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let section0;
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;
    	let t7;
    	let li4;
    	let t9;
    	let li5;
    	let t11;
    	let li6;
    	let t13;
    	let li7;
    	let t15;
    	let li8;
    	let t17;
    	let section1;
    	let div81;
    	let div80;
    	let div5;
    	let div2;
    	let div0;
    	let t19;
    	let div1;
    	let t21;
    	let div3;
    	let t22;
    	let div4;
    	let p0;
    	let t24;
    	let div12;
    	let div8;
    	let div6;
    	let t26;
    	let div7;
    	let t28;
    	let div10;
    	let div9;
    	let p1;
    	let t30;
    	let img0;
    	let img0_src_value;
    	let t31;
    	let div11;
    	let t32;
    	let div19;
    	let div15;
    	let div13;
    	let t34;
    	let div14;
    	let t36;
    	let div17;
    	let div16;
    	let p2;
    	let t38;
    	let p3;
    	let t40;
    	let p4;
    	let t42;
    	let p5;
    	let t44;
    	let p6;
    	let t46;
    	let img1;
    	let img1_src_value;
    	let t47;
    	let div18;
    	let p7;
    	let t49;
    	let div32;
    	let div22;
    	let div20;
    	let t51;
    	let div21;
    	let t53;
    	let p8;
    	let t55;
    	let div24;
    	let div23;
    	let p9;
    	let t57;
    	let p10;
    	let t59;
    	let p11;
    	let t60;
    	let span0;
    	let t62;
    	let t63;
    	let p12;
    	let t64;
    	let span1;
    	let t66;
    	let t67;
    	let p13;
    	let t69;
    	let img2;
    	let img2_src_value;
    	let t70;
    	let div26;
    	let div25;
    	let p14;
    	let t72;
    	let p15;
    	let t74;
    	let p16;
    	let t75;
    	let span2;
    	let t77;
    	let t78;
    	let p17;
    	let t80;
    	let img3;
    	let img3_src_value;
    	let t81;
    	let div28;
    	let div27;
    	let p18;
    	let t83;
    	let p19;
    	let t84;
    	let span3;
    	let t86;
    	let img4;
    	let img4_src_value;
    	let t87;
    	let div30;
    	let div29;
    	let p20;
    	let t88;
    	let span4;
    	let t90;
    	let img5;
    	let img5_src_value;
    	let t91;
    	let div31;
    	let p21;
    	let t92;
    	let span5;
    	let t94;
    	let div41;
    	let div35;
    	let div33;
    	let t96;
    	let div34;
    	let t98;
    	let p22;
    	let t100;
    	let div37;
    	let div36;
    	let p23;
    	let t102;
    	let p24;
    	let t104;
    	let img6;
    	let img6_src_value;
    	let t105;
    	let div39;
    	let div38;
    	let p25;
    	let t106;
    	let span6;
    	let t108;
    	let span7;
    	let t110;
    	let t111;
    	let p26;
    	let t112;
    	let span8;
    	let t114;
    	let p27;
    	let t116;
    	let p28;
    	let t118;
    	let p29;
    	let t119;
    	let span9;
    	let t121;
    	let t122;
    	let img7;
    	let img7_src_value;
    	let t123;
    	let div40;
    	let p30;
    	let t124;
    	let div54;
    	let div44;
    	let div42;
    	let t126;
    	let div43;
    	let t128;
    	let p31;
    	let t130;
    	let div46;
    	let div45;
    	let p32;
    	let t132;
    	let p33;
    	let t134;
    	let p34;
    	let t135;
    	let p35;
    	let t136;
    	let img8;
    	let img8_src_value;
    	let t137;
    	let div48;
    	let div47;
    	let p36;
    	let t139;
    	let p37;
    	let t141;
    	let p38;
    	let t143;
    	let p39;
    	let t144;
    	let p40;
    	let t145;
    	let img9;
    	let img9_src_value;
    	let t146;
    	let div50;
    	let div49;
    	let p41;
    	let t148;
    	let p42;
    	let t150;
    	let p43;
    	let t152;
    	let p44;
    	let t153;
    	let p45;
    	let t154;
    	let img10;
    	let img10_src_value;
    	let t155;
    	let p46;
    	let t157;
    	let div52;
    	let div51;
    	let p47;
    	let t158;
    	let p48;
    	let t159;
    	let p49;
    	let t160;
    	let p50;
    	let t161;
    	let p51;
    	let t162;
    	let img11;
    	let img11_src_value;
    	let t163;
    	let div53;
    	let p52;
    	let t165;
    	let div63;
    	let div57;
    	let div55;
    	let t167;
    	let div56;
    	let t169;
    	let p53;
    	let t171;
    	let div59;
    	let div58;
    	let p54;
    	let t173;
    	let p55;
    	let t175;
    	let p56;
    	let t177;
    	let p57;
    	let t179;
    	let img12;
    	let img12_src_value;
    	let t180;
    	let div61;
    	let div60;
    	let p58;
    	let t182;
    	let p59;
    	let t184;
    	let p60;
    	let t186;
    	let p61;
    	let t188;
    	let img13;
    	let img13_src_value;
    	let t189;
    	let div62;
    	let p62;
    	let t191;
    	let div72;
    	let div66;
    	let div64;
    	let t193;
    	let div65;
    	let t195;
    	let p63;
    	let t197;
    	let div68;
    	let div67;
    	let p64;
    	let t199;
    	let p65;
    	let t201;
    	let p66;
    	let t203;
    	let p67;
    	let t204;
    	let img14;
    	let img14_src_value;
    	let t205;
    	let div70;
    	let div69;
    	let p68;
    	let t207;
    	let p69;
    	let t209;
    	let p70;
    	let t211;
    	let p71;
    	let t212;
    	let img15;
    	let img15_src_value;
    	let t213;
    	let div71;
    	let p72;
    	let t214;
    	let div79;
    	let div75;
    	let div73;
    	let t216;
    	let div74;
    	let t218;
    	let div77;
    	let div76;
    	let p73;
    	let t220;
    	let br0;
    	let t221;
    	let p74;
    	let t223;
    	let p75;
    	let t225;
    	let br1;
    	let t226;
    	let p76;
    	let t228;
    	let p77;
    	let t230;
    	let br2;
    	let t231;
    	let p78;
    	let t233;
    	let div78;
    	let img16;
    	let img16_src_value;
    	let t234;
    	let p79;
    	let current;
    	let dispose;

    	const youtube = new Src({
    			props: { videoId: "R-R0KrXvWbc" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			section0 = element("section");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "01. Get to know your Rubik's Cube";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "02. Make the Daisy";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "03. Create the White Cross";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "04. Solve the Bottom Layer";
    			t7 = space();
    			li4 = element("li");
    			li4.textContent = "05. Solve the Second Layer";
    			t9 = space();
    			li5 = element("li");
    			li5.textContent = "06. Create the Yellow Cross";
    			t11 = space();
    			li6 = element("li");
    			li6.textContent = "07. Solve the Yellow Face";
    			t13 = space();
    			li7 = element("li");
    			li7.textContent = "08. Position the Corners";
    			t15 = space();
    			li8 = element("li");
    			li8.textContent = "09. Position the Final Edges";
    			t17 = space();
    			section1 = element("section");
    			div81 = element("div");
    			div80 = element("div");
    			div5 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "01";
    			t19 = space();
    			div1 = element("div");
    			div1.textContent = "Get to know your Rubik's Cube";
    			t21 = space();
    			div3 = element("div");
    			create_component(youtube.$$.fragment);
    			t22 = space();
    			div4 = element("div");
    			p0 = element("p");
    			p0.textContent = "This video provides a step-by-step tutorial for solving the Rubik's Cube. Also included is a basic understanding of the Rubik's Cube that will set you up nicely for this guide.";
    			t24 = space();
    			div12 = element("div");
    			div8 = element("div");
    			div6 = element("div");
    			div6.textContent = "02";
    			t26 = space();
    			div7 = element("div");
    			div7.textContent = "Make the Daisy";
    			t28 = space();
    			div10 = element("div");
    			div9 = element("div");
    			p1 = element("p");
    			p1.textContent = "For this step, simply do whatever you need to get the middle white square to be surrounded by 4 yellow stickers on each edge.";
    			t30 = space();
    			img0 = element("img");
    			t31 = space();
    			div11 = element("div");
    			t32 = space();
    			div19 = element("div");
    			div15 = element("div");
    			div13 = element("div");
    			div13.textContent = "03";
    			t34 = space();
    			div14 = element("div");
    			div14.textContent = "Create the White Cross";
    			t36 = space();
    			div17 = element("div");
    			div16 = element("div");
    			p2 = element("p");
    			p2.textContent = "Align each white edge piece (on the top of the cube) so it’s adjacent color is matched to the color in the middle of each side.";
    			t38 = space();
    			p3 = element("p");
    			p3.textContent = "In this example above, on the right side red is already matched to the red in the middle of that side. However, on the left side, the orange is not – it’s matched to blue.";
    			t40 = space();
    			p4 = element("p");
    			p4.textContent = "If the colors are matched, turn the face of that side 2 times.";
    			t42 = space();
    			p5 = element("p");
    			p5.textContent = "If the colors are not matched, rotate the top until they do match. When they match, turn that side 2 times.";
    			t44 = space();
    			p6 = element("p");
    			p6.textContent = "Repeat this for each white edge piece";
    			t46 = space();
    			img1 = element("img");
    			t47 = space();
    			div18 = element("div");
    			p7 = element("p");
    			p7.textContent = "If done correctly, you should have a white cross on the bottom and each white edges’ adjacent color will be matched properly to the middle color on each side";
    			t49 = space();
    			div32 = element("div");
    			div22 = element("div");
    			div20 = element("div");
    			div20.textContent = "04";
    			t51 = space();
    			div21 = element("div");
    			div21.textContent = "Solve the Bottom Layer";
    			t53 = space();
    			p8 = element("p");
    			p8.textContent = "Start by flipping the cube over so that the yellow middle sticker is point up. You will keep the yellow sticker pointing up for the remainder of the solve.";
    			t55 = space();
    			div24 = element("div");
    			div23 = element("div");
    			p9 = element("p");
    			p9.textContent = "WHITE STICKER(s) ON TOP ROW CORNER";
    			t57 = space();
    			p10 = element("p");
    			p10.textContent = "First, look for white stickers on the top layer facing outward. When found, rotate the top row (if necessary) so that its right adjacent sticker is matched to the color of that side.";
    			t59 = space();
    			p11 = element("p");
    			t60 = text("Perform the ");
    			span0 = element("span");
    			span0.textContent = "LEFT TRIGGER";
    			t62 = text(" move since the white/red sticker is to the top/left of the red middle sticker.");
    			t63 = space();
    			p12 = element("p");
    			t64 = text("If the red sticker was to the top/right of red middle sticker, perform the ");
    			span1 = element("span");
    			span1.textContent = "RIGHT TRIGGER";
    			t66 = text(" move.");
    			t67 = space();
    			p13 = element("p");
    			p13.textContent = "Repeat this for all the top row corner pieces";
    			t69 = space();
    			img2 = element("img");
    			t70 = space();
    			div26 = element("div");
    			div25 = element("div");
    			p14 = element("p");
    			p14.textContent = "WHITE STICKER(s) ON THE TOP FACE CORNER";
    			t72 = space();
    			p15 = element("p");
    			p15.textContent = "First, check to make that the white stick on top is directly above an empty white spot on the bottom of the cube. If it’s not, rotate the top row so that it is.";
    			t74 = space();
    			p16 = element("p");
    			t75 = text("Once aligned above an empty white spot, perform either the  ");
    			span2 = element("span");
    			span2.textContent = "RIGHT or LEFT TRIGGER";
    			t77 = text(" move (depending on how you’re holding the cube) – just make sure your starting the trigger move on the side with the white sticker.");
    			t78 = space();
    			p17 = element("p");
    			p17.textContent = "After you’ve done the trigger move twice. You should now have a white sticker on the top row on a side corner. With that in place, perform the steps when you have a white sticker on the top row on a side corner.";
    			t80 = space();
    			img3 = element("img");
    			t81 = space();
    			div28 = element("div");
    			div27 = element("div");
    			p18 = element("p");
    			p18.textContent = "WHITE STICKER(s) ON BOTTOM ROW CORNER";
    			t83 = space();
    			p19 = element("p");
    			t84 = text("If the white sticker is on a bottom right corner, perform the ");
    			span3 = element("span");
    			span3.textContent = "RIGHT TRIGGER";
    			t86 = space();
    			img4 = element("img");
    			t87 = space();
    			div30 = element("div");
    			div29 = element("div");
    			p20 = element("p");
    			t88 = text("If the white sticker is on a bottom left corner, perform the ");
    			span4 = element("span");
    			span4.textContent = "LEFT TRIGGER";
    			t90 = space();
    			img5 = element("img");
    			t91 = space();
    			div31 = element("div");
    			p21 = element("p");
    			t92 = text("After performing either one of the previous moves, there will now be a white sticker on the top face. As such, perform the step above for ");
    			span5 = element("span");
    			span5.textContent = "WHITE STICKERS ON TOP FACE CORNER";
    			t94 = space();
    			div41 = element("div");
    			div35 = element("div");
    			div33 = element("div");
    			div33.textContent = "05";
    			t96 = space();
    			div34 = element("div");
    			div34.textContent = "Solve the Second Layer";
    			t98 = space();
    			p22 = element("p");
    			p22.textContent = "At this point you should now have a completely white bottom and the first layer solved. For this step, you should be focusing on top row and the top face edge pieces.";
    			t100 = space();
    			div37 = element("div");
    			div36 = element("div");
    			p23 = element("p");
    			p23.textContent = "First, look for a top edge piece and its corresponding adjacent color that does NOT have a yellow sticker. For example, in the picture below, look for orange/green combo, green/red, or orange/blue.";
    			t102 = space();
    			p24 = element("p");
    			p24.textContent = "When found, rotate the top row so that the top row middle face color matches to the color in the middle of the face.";
    			t104 = space();
    			img6 = element("img");
    			t105 = space();
    			div39 = element("div");
    			div38 = element("div");
    			p25 = element("p");
    			t106 = text("Next, look at the color of the sticker on the top face (in this example, orange). Since orange is the right face, you’ll first ");
    			span6 = element("span");
    			span6.textContent = "rotate the top row clockwise 1x";
    			t108 = text(" and then perform the");
    			span7 = element("span");
    			span7.textContent = "RIGHT TRIGGER";
    			t110 = text(" move.");
    			t111 = space();
    			p26 = element("p");
    			t112 = text("Then, perform the move when ");
    			span8 = element("span");
    			span8.textContent = "WHITE STICKER ON TOP ROW CORNER";
    			t114 = space();
    			p27 = element("p");
    			p27.textContent = "**Note: if the color of the sticker on the top face was on the left face, then you would rotate the top row counter-clockwise 1x and then perform the LEFT TRIGGER move";
    			t116 = space();
    			p28 = element("p");
    			p28.textContent = "Continue to repeat until either A) All top row edge piece color combinations include a yellow sticker or B) the 2nd row is solved.";
    			t118 = space();
    			p29 = element("p");
    			t119 = text("IF… A). all top row edge piece color combinations include a yellow sticker (see below), then you’ll need to perform either the ");
    			span9 = element("span");
    			span9.textContent = "RIGHT TRIGGER or LEFT TRIGGER ";
    			t121 = text("on a side with a missing 2nd row piece. After you perform the trigger move, it should allow you perform the previous moves in this step to complete the 2nd row.");
    			t122 = space();
    			img7 = element("img");
    			t123 = space();
    			div40 = element("div");
    			p30 = element("p");
    			t124 = space();
    			div54 = element("div");
    			div44 = element("div");
    			div42 = element("div");
    			div42.textContent = "06";
    			t126 = space();
    			div43 = element("div");
    			div43.textContent = "Create the Yellow Cross";
    			t128 = space();
    			p31 = element("p");
    			p31.textContent = "When you get this step, you may have 1 of the following scenarios";
    			t130 = space();
    			div46 = element("div");
    			div45 = element("div");
    			p32 = element("p");
    			p32.textContent = "A) No Yellow edge pieces on top";
    			t132 = space();
    			p33 = element("p");
    			p33.textContent = "F U R U’ R’ F’";
    			t134 = space();
    			p34 = element("p");
    			t135 = space();
    			p35 = element("p");
    			t136 = space();
    			img8 = element("img");
    			t137 = space();
    			div48 = element("div");
    			div47 = element("div");
    			p36 = element("p");
    			p36.textContent = "B) Two yellow edges pieces that form a straight line";
    			t139 = space();
    			p37 = element("p");
    			p37.textContent = "Turn the top row (if necessary) so that it forms a straight line - from your perspective. Then...";
    			t141 = space();
    			p38 = element("p");
    			p38.textContent = "F U R U’ R’ F’";
    			t143 = space();
    			p39 = element("p");
    			t144 = space();
    			p40 = element("p");
    			t145 = space();
    			img9 = element("img");
    			t146 = space();
    			div50 = element("div");
    			div49 = element("div");
    			p41 = element("p");
    			p41.textContent = "C) Two edge pieces that form an L";
    			t148 = space();
    			p42 = element("p");
    			p42.textContent = "Rotate the top row (if necessary) so that the edge pieces are at 12 and 9 - from your perspective";
    			t150 = space();
    			p43 = element("p");
    			p43.textContent = "F U R U’ R’ F’";
    			t152 = space();
    			p44 = element("p");
    			t153 = space();
    			p45 = element("p");
    			t154 = space();
    			img10 = element("img");
    			t155 = space();
    			p46 = element("p");
    			p46.textContent = "** Continue to repeat until you have a yellow cross on top";
    			t157 = space();
    			div52 = element("div");
    			div51 = element("div");
    			p47 = element("p");
    			t158 = space();
    			p48 = element("p");
    			t159 = space();
    			p49 = element("p");
    			t160 = space();
    			p50 = element("p");
    			t161 = space();
    			p51 = element("p");
    			t162 = space();
    			img11 = element("img");
    			t163 = space();
    			div53 = element("div");
    			p52 = element("p");
    			p52.textContent = "Note… you may have extra yellow corner pieces (this is okay – repeat steps above until you have a yellow cross).";
    			t165 = space();
    			div63 = element("div");
    			div57 = element("div");
    			div55 = element("div");
    			div55.textContent = "07";
    			t167 = space();
    			div56 = element("div");
    			div56.textContent = "Solve the Yellow Face";
    			t169 = space();
    			p53 = element("p");
    			p53.textContent = "Once you have a yellow cross, inspect the top face.";
    			t171 = space();
    			div59 = element("div");
    			div58 = element("div");
    			p54 = element("p");
    			p54.textContent = "Fish Pattern";
    			t173 = space();
    			p55 = element("p");
    			p55.textContent = "If there are three empty corners on the top face, it will look like a “fish” pattern. If you have the fish pattern, rotate the top so that the mouth is down and to the left.";
    			t175 = space();
    			p56 = element("p");
    			p56.textContent = "Then, perform this algorithm";
    			t177 = space();
    			p57 = element("p");
    			p57.textContent = "R U R' U R U2 R'";
    			t179 = space();
    			img12 = element("img");
    			t180 = space();
    			div61 = element("div");
    			div60 = element("div");
    			p58 = element("p");
    			p58.textContent = "No Fish Pattern";
    			t182 = space();
    			p59 = element("p");
    			p59.textContent = "If you have zero or two yellow corner stickers, rotate the top of the cube so that you have a yellow sticker in the upper right corner of the left face.";
    			t184 = space();
    			p60 = element("p");
    			p60.textContent = "Then, perform this algorithm";
    			t186 = space();
    			p61 = element("p");
    			p61.textContent = "R U R' U R U2 R'";
    			t188 = space();
    			img13 = element("img");
    			t189 = space();
    			div62 = element("div");
    			p62 = element("p");
    			p62.textContent = "Note: You may need to repeat the “fish” pattern 2x";
    			t191 = space();
    			div72 = element("div");
    			div66 = element("div");
    			div64 = element("div");
    			div64.textContent = "08";
    			t193 = space();
    			div65 = element("div");
    			div65.textContent = "Position the Corners";
    			t195 = space();
    			p63 = element("p");
    			p63.textContent = "At this point, you should have a fully completed top yellow face. Now, the goal of this step is to have one side with matching top corner stickers.";
    			t197 = space();
    			div68 = element("div");
    			div67 = element("div");
    			p64 = element("p");
    			p64.textContent = "If there are no matching top corner pieces...";
    			t199 = space();
    			p65 = element("p");
    			p65.textContent = "Perform this algorithm";
    			t201 = space();
    			p66 = element("p");
    			p66.textContent = "L’ U R U’ L U R’ R U R’ U R U2 R’";
    			t203 = space();
    			p67 = element("p");
    			t204 = space();
    			img14 = element("img");
    			t205 = space();
    			div70 = element("div");
    			div69 = element("div");
    			p68 = element("p");
    			p68.textContent = "If there is a side that has matching corner colors, rotate the top layer so that it is aligned with the corresponding face and position it so that face is in your left hand.";
    			t207 = space();
    			p69 = element("p");
    			p69.textContent = "Then, perform the same algorithm";
    			t209 = space();
    			p70 = element("p");
    			p70.textContent = "L’ U R U’ L U R’ R U R’ U R U2 R’";
    			t211 = space();
    			p71 = element("p");
    			t212 = space();
    			img15 = element("img");
    			t213 = space();
    			div71 = element("div");
    			p72 = element("p");
    			t214 = space();
    			div79 = element("div");
    			div75 = element("div");
    			div73 = element("div");
    			div73.textContent = "09";
    			t216 = space();
    			div74 = element("div");
    			div74.textContent = "Position the Final Edges";
    			t218 = space();
    			div77 = element("div");
    			div76 = element("div");
    			p73 = element("p");
    			p73.textContent = "If one of the sides is completely solved, face that side away and perform the appropriate pattern:";
    			t220 = space();
    			br0 = element("br");
    			t221 = space();
    			p74 = element("p");
    			p74.textContent = "Swap top middle edges in clockerwise manner:";
    			t223 = space();
    			p75 = element("p");
    			p75.textContent = "F2 U R’ L F2 L’ R U F2";
    			t225 = space();
    			br1 = element("br");
    			t226 = space();
    			p76 = element("p");
    			p76.textContent = "Swap top middle edges in counter-clockwise manner:";
    			t228 = space();
    			p77 = element("p");
    			p77.textContent = "F2 U’ R’ L F2 L’ R U’ F2";
    			t230 = space();
    			br2 = element("br");
    			t231 = space();
    			p78 = element("p");
    			p78.textContent = "If none of the sides are solved, perform the counter clockwise algorithm once, reposition and then perform the appropriate clockwise or counter-clockwise algorithm.";
    			t233 = space();
    			div78 = element("div");
    			img16 = element("img");
    			t234 = space();
    			p79 = element("p");
    			p79.textContent = "Congratulations! You just solved the Rubik’s Cube!";
    			attr_dev(li0, "class", "svelte-9vf8tb");
    			add_location(li0, file$2, 32, 12, 1300);
    			attr_dev(li1, "class", "svelte-9vf8tb");
    			add_location(li1, file$2, 33, 12, 1382);
    			attr_dev(li2, "class", "svelte-9vf8tb");
    			add_location(li2, file$2, 34, 12, 1449);
    			attr_dev(li3, "class", "svelte-9vf8tb");
    			add_location(li3, file$2, 35, 12, 1524);
    			attr_dev(li4, "class", "svelte-9vf8tb");
    			add_location(li4, file$2, 36, 12, 1599);
    			attr_dev(li5, "class", "svelte-9vf8tb");
    			add_location(li5, file$2, 37, 12, 1674);
    			attr_dev(li6, "class", "svelte-9vf8tb");
    			add_location(li6, file$2, 38, 12, 1750);
    			attr_dev(li7, "class", "svelte-9vf8tb");
    			add_location(li7, file$2, 39, 12, 1824);
    			attr_dev(li8, "class", "svelte-9vf8tb");
    			add_location(li8, file$2, 40, 12, 1897);
    			attr_dev(ul, "class", "svelte-9vf8tb");
    			add_location(ul, file$2, 31, 2, 1283);
    			attr_dev(section0, "class", "left svelte-9vf8tb");
    			add_location(section0, file$2, 28, 1, 1254);
    			attr_dev(div0, "class", "number svelte-9vf8tb");
    			add_location(div0, file$2, 52, 24, 2250);
    			attr_dev(div1, "class", "text svelte-9vf8tb");
    			add_location(div1, file$2, 57, 24, 2410);
    			attr_dev(div2, "class", "headerContainer1 svelte-9vf8tb");
    			add_location(div2, file$2, 49, 20, 2150);
    			attr_dev(div3, "class", "middle1 svelte-9vf8tb");
    			add_location(div3, file$2, 63, 20, 2618);
    			add_location(p0, file$2, 71, 24, 2881);
    			attr_dev(div4, "class", "bottom1 svelte-9vf8tb");
    			add_location(div4, file$2, 68, 20, 2790);
    			attr_dev(div5, "class", "step1 svelte-9vf8tb");
    			add_location(div5, file$2, 48, 16, 2110);
    			attr_dev(div6, "class", "number svelte-9vf8tb");
    			add_location(div6, file$2, 78, 24, 3270);
    			attr_dev(div7, "class", "text svelte-9vf8tb");
    			add_location(div7, file$2, 83, 24, 3430);
    			attr_dev(div8, "class", "headerContainer svelte-9vf8tb");
    			add_location(div8, file$2, 75, 20, 3171);
    			add_location(p1, file$2, 95, 28, 3821);
    			attr_dev(div9, "class", "middle2text svelte-9vf8tb");
    			add_location(div9, file$2, 92, 24, 3714);
    			if (img0.src !== (img0_src_value = /*daisy*/ ctx[2])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "daisy goes here");
    			attr_dev(img0, "class", "svelte-9vf8tb");
    			add_location(img0, file$2, 97, 24, 4009);
    			attr_dev(div10, "class", "middle2 svelte-9vf8tb");
    			add_location(div10, file$2, 89, 20, 3623);
    			attr_dev(div11, "class", "bottom2 svelte-9vf8tb");
    			add_location(div11, file$2, 99, 20, 4097);
    			attr_dev(div12, "class", "step2 svelte-9vf8tb");
    			add_location(div12, file$2, 74, 16, 3131);
    			attr_dev(div13, "class", "number svelte-9vf8tb");
    			add_location(div13, file$2, 108, 24, 4369);
    			attr_dev(div14, "class", "text svelte-9vf8tb");
    			add_location(div14, file$2, 113, 24, 4529);
    			attr_dev(div15, "class", "headerContainer svelte-9vf8tb");
    			add_location(div15, file$2, 105, 20, 4270);
    			add_location(p2, file$2, 125, 28, 4928);
    			set_style(p3, "font-style", "italic");
    			add_location(p3, file$2, 126, 28, 5091);
    			set_style(p4, "padding-top", "10px");
    			add_location(p4, file$2, 127, 28, 5327);
    			add_location(p5, file$2, 128, 28, 5452);
    			add_location(p6, file$2, 129, 28, 5595);
    			attr_dev(div16, "class", "middle2text svelte-9vf8tb");
    			add_location(div16, file$2, 122, 24, 4821);
    			if (img1.src !== (img1_src_value = /*whiteCross*/ ctx[7])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "daisy goes here");
    			attr_dev(img1, "class", "svelte-9vf8tb");
    			add_location(img1, file$2, 131, 24, 5695);
    			attr_dev(div17, "class", "middle2 svelte-9vf8tb");
    			add_location(div17, file$2, 119, 20, 4730);
    			add_location(p7, file$2, 136, 28, 5883);
    			attr_dev(div18, "class", "bottom2 svelte-9vf8tb");
    			add_location(div18, file$2, 133, 20, 5788);
    			attr_dev(div19, "class", "step3 svelte-9vf8tb");
    			add_location(div19, file$2, 104, 16, 4230);
    			attr_dev(div20, "class", "number svelte-9vf8tb");
    			add_location(div20, file$2, 143, 24, 6253);
    			attr_dev(div21, "class", "text svelte-9vf8tb");
    			add_location(div21, file$2, 148, 24, 6413);
    			attr_dev(div22, "class", "headerContainer svelte-9vf8tb");
    			add_location(div22, file$2, 140, 20, 6154);
    			add_location(p8, file$2, 154, 28, 6622);
    			set_style(p9, "text-decoration", "underline");
    			add_location(p9, file$2, 161, 28, 7003);
    			add_location(p10, file$2, 162, 28, 7109);
    			set_style(span0, "font-weight", "bold");
    			add_location(span0, file$2, 163, 43, 7343);
    			add_location(p11, file$2, 163, 28, 7328);
    			set_style(span1, "font-weight", "bold");
    			add_location(span1, file$2, 164, 106, 7585);
    			add_location(p12, file$2, 164, 28, 7507);
    			add_location(p13, file$2, 165, 28, 7677);
    			attr_dev(div23, "class", "middle4text svelte-9vf8tb");
    			add_location(div23, file$2, 158, 24, 6896);
    			if (img2.src !== (img2_src_value = /*whiteTopCorner*/ ctx[8])) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "top white goes here");
    			attr_dev(img2, "class", "svelte-9vf8tb");
    			add_location(img2, file$2, 167, 24, 7785);
    			attr_dev(div24, "class", "middle4 svelte-9vf8tb");
    			add_location(div24, file$2, 155, 20, 6805);
    			set_style(p14, "text-decoration", "underline");
    			add_location(p14, file$2, 175, 28, 8084);
    			add_location(p15, file$2, 176, 28, 8195);
    			set_style(span2, "font-weight", "bold");
    			add_location(span2, file$2, 177, 91, 8455);
    			add_location(p16, file$2, 177, 28, 8392);
    			add_location(p17, file$2, 178, 28, 8680);
    			attr_dev(div25, "class", "middle4text svelte-9vf8tb");
    			add_location(div25, file$2, 172, 24, 7977);
    			if (img3.src !== (img3_src_value = /*whiteTopFaceCorner*/ ctx[9])) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "top white face goes here");
    			attr_dev(img3, "class", "svelte-9vf8tb");
    			add_location(img3, file$2, 180, 24, 8954);
    			attr_dev(div26, "class", "middle4 svelte-9vf8tb");
    			add_location(div26, file$2, 169, 20, 7886);
    			set_style(p18, "text-decoration", "underline");
    			add_location(p18, file$2, 188, 28, 9262);
    			set_style(span3, "font-weight", "bold");
    			add_location(span3, file$2, 189, 93, 9436);
    			add_location(p19, file$2, 189, 28, 9371);
    			attr_dev(div27, "class", "middle4text svelte-9vf8tb");
    			add_location(div27, file$2, 185, 24, 9155);
    			if (img4.src !== (img4_src_value = /*whiteBottomRow*/ ctx[6])) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "white cross goes here");
    			attr_dev(img4, "class", "svelte-9vf8tb");
    			add_location(img4, file$2, 191, 24, 9550);
    			attr_dev(div28, "class", "middle4 svelte-9vf8tb");
    			add_location(div28, file$2, 182, 20, 9064);
    			set_style(span4, "font-weight", "bold");
    			add_location(span4, file$2, 199, 92, 9915);
    			add_location(p20, file$2, 199, 28, 9851);
    			attr_dev(div29, "class", "middle4text svelte-9vf8tb");
    			add_location(div29, file$2, 196, 24, 9744);
    			if (img5.src !== (img5_src_value = /*whiteBottomLeft*/ ctx[5])) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "white cross goes here");
    			attr_dev(img5, "class", "svelte-9vf8tb");
    			add_location(img5, file$2, 201, 24, 10028);
    			attr_dev(div30, "class", "middle4 svelte-9vf8tb");
    			add_location(div30, file$2, 193, 20, 9653);
    			set_style(span5, "text-decoration", "underline");
    			add_location(span5, file$2, 206, 169, 10368);
    			add_location(p21, file$2, 206, 28, 10227);
    			attr_dev(div31, "class", "bottom4 svelte-9vf8tb");
    			add_location(div31, file$2, 203, 20, 10132);
    			attr_dev(div32, "class", "step4 svelte-9vf8tb");
    			add_location(div32, file$2, 139, 16, 6114);
    			attr_dev(div33, "class", "number svelte-9vf8tb");
    			add_location(div33, file$2, 213, 24, 10659);
    			attr_dev(div34, "class", "text svelte-9vf8tb");
    			add_location(div34, file$2, 218, 24, 10819);
    			attr_dev(div35, "class", "headerContainer svelte-9vf8tb");
    			add_location(div35, file$2, 210, 20, 10560);
    			add_location(p22, file$2, 224, 24, 11024);
    			add_location(p23, file$2, 231, 28, 11417);
    			add_location(p24, file$2, 232, 28, 11650);
    			attr_dev(div36, "class", "middle5text svelte-9vf8tb");
    			add_location(div36, file$2, 228, 24, 11310);
    			if (img6.src !== (img6_src_value = /*secondLayer*/ ctx[4])) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "white cross goes here");
    			attr_dev(img6, "class", "svelte-9vf8tb");
    			add_location(img6, file$2, 237, 24, 11946);
    			attr_dev(div37, "class", "middle5 svelte-9vf8tb");
    			add_location(div37, file$2, 225, 20, 11219);
    			set_style(span6, "font-weight", "bold");
    			add_location(span6, file$2, 245, 158, 12374);
    			set_style(span7, "font-weight", "bold");
    			add_location(span7, file$2, 245, 249, 12465);
    			add_location(p25, file$2, 245, 28, 12244);
    			set_style(span8, "text-decoration", "underline");
    			add_location(span8, file$2, 246, 59, 12587);
    			add_location(p26, file$2, 246, 28, 12556);
    			set_style(p27, "font-style", "italic");
    			add_location(p27, file$2, 247, 28, 12699);
    			add_location(p28, file$2, 248, 28, 12930);
    			set_style(span9, "font-weight", "bold");
    			add_location(span9, file$2, 249, 158, 13226);
    			add_location(p29, file$2, 249, 28, 13096);
    			attr_dev(div38, "class", "middle5text svelte-9vf8tb");
    			add_location(div38, file$2, 242, 24, 12137);
    			if (img7.src !== (img7_src_value = /*secondLayerStuck*/ ctx[3])) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "white cross goes here");
    			attr_dev(img7, "class", "svelte-9vf8tb");
    			add_location(img7, file$2, 251, 24, 13516);
    			attr_dev(div39, "class", "middle5 svelte-9vf8tb");
    			add_location(div39, file$2, 239, 20, 12046);
    			add_location(p30, file$2, 256, 28, 13716);
    			attr_dev(div40, "class", "bottom5 svelte-9vf8tb");
    			add_location(div40, file$2, 253, 20, 13621);
    			attr_dev(div41, "class", "step5 svelte-9vf8tb");
    			add_location(div41, file$2, 209, 16, 10520);
    			attr_dev(div42, "class", "number svelte-9vf8tb");
    			add_location(div42, file$2, 263, 24, 13929);
    			attr_dev(div43, "class", "text svelte-9vf8tb");
    			add_location(div43, file$2, 268, 24, 14089);
    			attr_dev(div44, "class", "headerContainer svelte-9vf8tb");
    			add_location(div44, file$2, 260, 20, 13830);
    			add_location(p31, file$2, 274, 24, 14295);
    			set_style(p32, "text-decoration", "underline");
    			add_location(p32, file$2, 281, 28, 14586);
    			set_style(p33, "font-weight", "bold");
    			add_location(p33, file$2, 282, 28, 14688);
    			add_location(p34, file$2, 283, 28, 14765);
    			add_location(p35, file$2, 284, 28, 14801);
    			attr_dev(div45, "class", "middle6text svelte-9vf8tb");
    			add_location(div45, file$2, 278, 24, 14479);
    			if (img8.src !== (img8_src_value = /*yellowCrossNoEdge*/ ctx[12])) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "yellow cross no edge goes here");
    			attr_dev(img8, "class", "svelte-9vf8tb");
    			add_location(img8, file$2, 286, 24, 14864);
    			attr_dev(div46, "class", "middle6 svelte-9vf8tb");
    			add_location(div46, file$2, 275, 20, 14388);
    			set_style(p36, "text-decoration", "underline");
    			add_location(p36, file$2, 294, 28, 15177);
    			add_location(p37, file$2, 295, 28, 15300);
    			set_style(p38, "font-weight", "bold");
    			add_location(p38, file$2, 296, 28, 15433);
    			add_location(p39, file$2, 297, 28, 15510);
    			add_location(p40, file$2, 298, 28, 15546);
    			attr_dev(div47, "class", "middle6text svelte-9vf8tb");
    			add_location(div47, file$2, 291, 24, 15070);
    			if (img9.src !== (img9_src_value = /*yellowCrossStraightLine*/ ctx[13])) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "yellow cross straight goes here");
    			attr_dev(img9, "class", "svelte-9vf8tb");
    			add_location(img9, file$2, 300, 24, 15609);
    			attr_dev(div48, "class", "middle6 svelte-9vf8tb");
    			add_location(div48, file$2, 288, 20, 14979);
    			set_style(p41, "text-decoration", "underline");
    			add_location(p41, file$2, 308, 28, 15929);
    			add_location(p42, file$2, 309, 28, 16033);
    			set_style(p43, "font-weight", "bold");
    			add_location(p43, file$2, 310, 28, 16166);
    			add_location(p44, file$2, 311, 28, 16243);
    			add_location(p45, file$2, 312, 28, 16279);
    			attr_dev(div49, "class", "middle6text svelte-9vf8tb");
    			add_location(div49, file$2, 305, 24, 15822);
    			if (img10.src !== (img10_src_value = /*yellowCrossL*/ ctx[11])) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "yellow cross L goes here");
    			attr_dev(img10, "class", "svelte-9vf8tb");
    			add_location(img10, file$2, 314, 24, 16342);
    			attr_dev(div50, "class", "middle6 svelte-9vf8tb");
    			add_location(div50, file$2, 302, 20, 15731);
    			add_location(p46, file$2, 316, 20, 16446);
    			add_location(p47, file$2, 323, 28, 16730);
    			add_location(p48, file$2, 324, 28, 16766);
    			add_location(p49, file$2, 325, 28, 16802);
    			add_location(p50, file$2, 326, 28, 16838);
    			add_location(p51, file$2, 327, 28, 16874);
    			attr_dev(div51, "class", "middle6text svelte-9vf8tb");
    			add_location(div51, file$2, 320, 24, 16623);
    			if (img11.src !== (img11_src_value = /*yellowCrossComplete*/ ctx[10])) attr_dev(img11, "src", img11_src_value);
    			attr_dev(img11, "alt", "yellow cross complete goes here");
    			attr_dev(img11, "class", "svelte-9vf8tb");
    			add_location(img11, file$2, 329, 24, 16937);
    			attr_dev(div52, "class", "middle6 svelte-9vf8tb");
    			add_location(div52, file$2, 317, 20, 16532);
    			add_location(p52, file$2, 334, 28, 17150);
    			attr_dev(div53, "class", "bottom6 svelte-9vf8tb");
    			add_location(div53, file$2, 331, 20, 17055);
    			attr_dev(div54, "class", "step6 svelte-9vf8tb");
    			add_location(div54, file$2, 259, 16, 13790);
    			attr_dev(div55, "class", "number svelte-9vf8tb");
    			add_location(div55, file$2, 341, 24, 17475);
    			attr_dev(div56, "class", "text svelte-9vf8tb");
    			add_location(div56, file$2, 346, 24, 17635);
    			attr_dev(div57, "class", "headerContainer svelte-9vf8tb");
    			add_location(div57, file$2, 338, 20, 17376);
    			add_location(p53, file$2, 352, 20, 17835);
    			set_style(p54, "text-decoration", "underline");
    			add_location(p54, file$2, 359, 28, 18112);
    			add_location(p55, file$2, 360, 28, 18195);
    			add_location(p56, file$2, 361, 28, 18405);
    			set_style(p57, "font-weight", "bold");
    			add_location(p57, file$2, 362, 28, 18469);
    			attr_dev(div58, "class", "middle7text svelte-9vf8tb");
    			add_location(div58, file$2, 356, 24, 18005);
    			if (img12.src !== (img12_src_value = /*yellowFaceFish*/ ctx[14])) attr_dev(img12, "src", img12_src_value);
    			attr_dev(img12, "alt", "yellow face goes here");
    			attr_dev(img12, "class", "svelte-9vf8tb");
    			add_location(img12, file$2, 364, 24, 18575);
    			attr_dev(div59, "class", "middle7 svelte-9vf8tb");
    			add_location(div59, file$2, 353, 20, 17914);
    			set_style(p58, "text-decoration", "underline");
    			add_location(p58, file$2, 372, 28, 18876);
    			add_location(p59, file$2, 373, 28, 18962);
    			add_location(p60, file$2, 374, 28, 19151);
    			set_style(p61, "font-weight", "bold");
    			add_location(p61, file$2, 375, 28, 19215);
    			attr_dev(div60, "class", "middle7text svelte-9vf8tb");
    			add_location(div60, file$2, 369, 24, 18769);
    			if (img13.src !== (img13_src_value = /*yellowFaceNoFish*/ ctx[15])) attr_dev(img13, "src", img13_src_value);
    			attr_dev(img13, "alt", "yellow no fish face goes here");
    			attr_dev(img13, "class", "svelte-9vf8tb");
    			add_location(img13, file$2, 377, 24, 19321);
    			attr_dev(div61, "class", "middle7 svelte-9vf8tb");
    			add_location(div61, file$2, 366, 20, 18678);
    			add_location(p62, file$2, 382, 28, 19529);
    			attr_dev(div62, "class", "bottom7 svelte-9vf8tb");
    			add_location(div62, file$2, 379, 20, 19434);
    			attr_dev(div63, "class", "step7 svelte-9vf8tb");
    			add_location(div63, file$2, 337, 16, 17336);
    			attr_dev(div64, "class", "number svelte-9vf8tb");
    			add_location(div64, file$2, 389, 24, 19792);
    			attr_dev(div65, "class", "text svelte-9vf8tb");
    			add_location(div65, file$2, 394, 24, 19952);
    			attr_dev(div66, "class", "headerContainer svelte-9vf8tb");
    			add_location(div66, file$2, 386, 20, 19693);
    			add_location(p63, file$2, 400, 20, 20151);
    			add_location(p64, file$2, 407, 28, 20525);
    			add_location(p65, file$2, 408, 28, 20606);
    			set_style(p66, "font-weight", "bold");
    			add_location(p66, file$2, 409, 28, 20664);
    			add_location(p67, file$2, 410, 28, 20760);
    			attr_dev(div67, "class", "middle8text svelte-9vf8tb");
    			add_location(div67, file$2, 404, 24, 20418);
    			if (img14.src !== (img14_src_value = /*cornersNoMatching*/ ctx[16])) attr_dev(img14, "src", img14_src_value);
    			attr_dev(img14, "alt", "corner positions goes here");
    			attr_dev(img14, "class", "svelte-9vf8tb");
    			add_location(img14, file$2, 412, 24, 20823);
    			attr_dev(div68, "class", "middle8 svelte-9vf8tb");
    			add_location(div68, file$2, 401, 20, 20327);
    			add_location(p68, file$2, 420, 28, 21132);
    			add_location(p69, file$2, 421, 28, 21342);
    			set_style(p70, "font-weight", "bold");
    			add_location(p70, file$2, 422, 28, 21410);
    			add_location(p71, file$2, 423, 28, 21506);
    			attr_dev(div69, "class", "middle8text svelte-9vf8tb");
    			add_location(div69, file$2, 417, 24, 21025);
    			if (img15.src !== (img15_src_value = /*cornersMatching*/ ctx[17])) attr_dev(img15, "src", img15_src_value);
    			attr_dev(img15, "alt", "corner positions goes here");
    			attr_dev(img15, "class", "svelte-9vf8tb");
    			add_location(img15, file$2, 425, 24, 21569);
    			attr_dev(div70, "class", "middle8 svelte-9vf8tb");
    			add_location(div70, file$2, 414, 20, 20934);
    			add_location(p72, file$2, 430, 28, 21773);
    			attr_dev(div71, "class", "bottom8 svelte-9vf8tb");
    			add_location(div71, file$2, 427, 20, 21678);
    			attr_dev(div72, "class", "step8 svelte-9vf8tb");
    			add_location(div72, file$2, 385, 16, 19653);
    			attr_dev(div73, "class", "number svelte-9vf8tb");
    			add_location(div73, file$2, 437, 24, 21986);
    			attr_dev(div74, "class", "text svelte-9vf8tb");
    			add_location(div74, file$2, 442, 24, 22146);
    			attr_dev(div75, "class", "headerContainer svelte-9vf8tb");
    			add_location(div75, file$2, 434, 20, 21887);
    			add_location(p73, file$2, 454, 28, 22547);
    			add_location(br0, file$2, 455, 28, 22681);
    			set_style(p74, "text-decoration", "underline");
    			add_location(p74, file$2, 456, 28, 22715);
    			set_style(p75, "font-weight", "bold");
    			add_location(p75, file$2, 457, 28, 22830);
    			add_location(br1, file$2, 458, 28, 22914);
    			set_style(p76, "text-decoration", "underline");
    			add_location(p76, file$2, 459, 28, 22948);
    			set_style(p77, "font-weight", "bold");
    			add_location(p77, file$2, 460, 28, 23069);
    			add_location(br2, file$2, 461, 28, 23155);
    			add_location(p78, file$2, 462, 28, 23189);
    			attr_dev(div76, "class", "middle9text svelte-9vf8tb");
    			add_location(div76, file$2, 451, 24, 22440);
    			attr_dev(div77, "class", "middle9 svelte-9vf8tb");
    			add_location(div77, file$2, 448, 20, 22349);
    			if (img16.src !== (img16_src_value = /*finalSolved*/ ctx[18])) attr_dev(img16, "src", img16_src_value);
    			attr_dev(img16, "alt", "final positions goes here");
    			attr_dev(img16, "class", "svelte-9vf8tb");
    			add_location(img16, file$2, 468, 24, 23530);
    			add_location(p79, file$2, 469, 28, 23615);
    			attr_dev(div78, "class", "bottom9 svelte-9vf8tb");
    			add_location(div78, file$2, 465, 20, 23439);
    			attr_dev(div79, "class", "step9 svelte-9vf8tb");
    			add_location(div79, file$2, 433, 16, 21847);
    			attr_dev(div80, "class", "track svelte-9vf8tb");
    			add_location(div80, file$2, 47, 9, 2054);
    			attr_dev(div81, "class", "steps");
    			add_location(div81, file$2, 46, 8, 2025);
    			attr_dev(section1, "class", "right svelte-9vf8tb");
    			add_location(section1, file$2, 43, 1, 1989);
    			attr_dev(main, "class", "svelte-9vf8tb");
    			add_location(main, file$2, 27, 0, 1246);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section0);
    			append_dev(section0, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(ul, t7);
    			append_dev(ul, li4);
    			append_dev(ul, t9);
    			append_dev(ul, li5);
    			append_dev(ul, t11);
    			append_dev(ul, li6);
    			append_dev(ul, t13);
    			append_dev(ul, li7);
    			append_dev(ul, t15);
    			append_dev(ul, li8);
    			append_dev(main, t17);
    			append_dev(main, section1);
    			append_dev(section1, div81);
    			append_dev(div81, div80);
    			append_dev(div80, div5);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t19);
    			append_dev(div2, div1);
    			append_dev(div5, t21);
    			append_dev(div5, div3);
    			mount_component(youtube, div3, null);
    			append_dev(div5, t22);
    			append_dev(div5, div4);
    			append_dev(div4, p0);
    			append_dev(div80, t24);
    			append_dev(div80, div12);
    			append_dev(div12, div8);
    			append_dev(div8, div6);
    			append_dev(div8, t26);
    			append_dev(div8, div7);
    			append_dev(div12, t28);
    			append_dev(div12, div10);
    			append_dev(div10, div9);
    			append_dev(div9, p1);
    			append_dev(div10, t30);
    			append_dev(div10, img0);
    			append_dev(div12, t31);
    			append_dev(div12, div11);
    			append_dev(div80, t32);
    			append_dev(div80, div19);
    			append_dev(div19, div15);
    			append_dev(div15, div13);
    			append_dev(div15, t34);
    			append_dev(div15, div14);
    			append_dev(div19, t36);
    			append_dev(div19, div17);
    			append_dev(div17, div16);
    			append_dev(div16, p2);
    			append_dev(div16, t38);
    			append_dev(div16, p3);
    			append_dev(div16, t40);
    			append_dev(div16, p4);
    			append_dev(div16, t42);
    			append_dev(div16, p5);
    			append_dev(div16, t44);
    			append_dev(div16, p6);
    			append_dev(div17, t46);
    			append_dev(div17, img1);
    			append_dev(div19, t47);
    			append_dev(div19, div18);
    			append_dev(div18, p7);
    			append_dev(div80, t49);
    			append_dev(div80, div32);
    			append_dev(div32, div22);
    			append_dev(div22, div20);
    			append_dev(div22, t51);
    			append_dev(div22, div21);
    			append_dev(div32, t53);
    			append_dev(div32, p8);
    			append_dev(div32, t55);
    			append_dev(div32, div24);
    			append_dev(div24, div23);
    			append_dev(div23, p9);
    			append_dev(div23, t57);
    			append_dev(div23, p10);
    			append_dev(div23, t59);
    			append_dev(div23, p11);
    			append_dev(p11, t60);
    			append_dev(p11, span0);
    			append_dev(p11, t62);
    			append_dev(div23, t63);
    			append_dev(div23, p12);
    			append_dev(p12, t64);
    			append_dev(p12, span1);
    			append_dev(p12, t66);
    			append_dev(div23, t67);
    			append_dev(div23, p13);
    			append_dev(div24, t69);
    			append_dev(div24, img2);
    			append_dev(div32, t70);
    			append_dev(div32, div26);
    			append_dev(div26, div25);
    			append_dev(div25, p14);
    			append_dev(div25, t72);
    			append_dev(div25, p15);
    			append_dev(div25, t74);
    			append_dev(div25, p16);
    			append_dev(p16, t75);
    			append_dev(p16, span2);
    			append_dev(p16, t77);
    			append_dev(div25, t78);
    			append_dev(div25, p17);
    			append_dev(div26, t80);
    			append_dev(div26, img3);
    			append_dev(div32, t81);
    			append_dev(div32, div28);
    			append_dev(div28, div27);
    			append_dev(div27, p18);
    			append_dev(div27, t83);
    			append_dev(div27, p19);
    			append_dev(p19, t84);
    			append_dev(p19, span3);
    			append_dev(div28, t86);
    			append_dev(div28, img4);
    			append_dev(div32, t87);
    			append_dev(div32, div30);
    			append_dev(div30, div29);
    			append_dev(div29, p20);
    			append_dev(p20, t88);
    			append_dev(p20, span4);
    			append_dev(div30, t90);
    			append_dev(div30, img5);
    			append_dev(div32, t91);
    			append_dev(div32, div31);
    			append_dev(div31, p21);
    			append_dev(p21, t92);
    			append_dev(p21, span5);
    			append_dev(div80, t94);
    			append_dev(div80, div41);
    			append_dev(div41, div35);
    			append_dev(div35, div33);
    			append_dev(div35, t96);
    			append_dev(div35, div34);
    			append_dev(div41, t98);
    			append_dev(div41, p22);
    			append_dev(div41, t100);
    			append_dev(div41, div37);
    			append_dev(div37, div36);
    			append_dev(div36, p23);
    			append_dev(div36, t102);
    			append_dev(div36, p24);
    			append_dev(div37, t104);
    			append_dev(div37, img6);
    			append_dev(div41, t105);
    			append_dev(div41, div39);
    			append_dev(div39, div38);
    			append_dev(div38, p25);
    			append_dev(p25, t106);
    			append_dev(p25, span6);
    			append_dev(p25, t108);
    			append_dev(p25, span7);
    			append_dev(p25, t110);
    			append_dev(div38, t111);
    			append_dev(div38, p26);
    			append_dev(p26, t112);
    			append_dev(p26, span8);
    			append_dev(div38, t114);
    			append_dev(div38, p27);
    			append_dev(div38, t116);
    			append_dev(div38, p28);
    			append_dev(div38, t118);
    			append_dev(div38, p29);
    			append_dev(p29, t119);
    			append_dev(p29, span9);
    			append_dev(p29, t121);
    			append_dev(div39, t122);
    			append_dev(div39, img7);
    			append_dev(div41, t123);
    			append_dev(div41, div40);
    			append_dev(div40, p30);
    			append_dev(div80, t124);
    			append_dev(div80, div54);
    			append_dev(div54, div44);
    			append_dev(div44, div42);
    			append_dev(div44, t126);
    			append_dev(div44, div43);
    			append_dev(div54, t128);
    			append_dev(div54, p31);
    			append_dev(div54, t130);
    			append_dev(div54, div46);
    			append_dev(div46, div45);
    			append_dev(div45, p32);
    			append_dev(div45, t132);
    			append_dev(div45, p33);
    			append_dev(div45, t134);
    			append_dev(div45, p34);
    			append_dev(div45, t135);
    			append_dev(div45, p35);
    			append_dev(div46, t136);
    			append_dev(div46, img8);
    			append_dev(div54, t137);
    			append_dev(div54, div48);
    			append_dev(div48, div47);
    			append_dev(div47, p36);
    			append_dev(div47, t139);
    			append_dev(div47, p37);
    			append_dev(div47, t141);
    			append_dev(div47, p38);
    			append_dev(div47, t143);
    			append_dev(div47, p39);
    			append_dev(div47, t144);
    			append_dev(div47, p40);
    			append_dev(div48, t145);
    			append_dev(div48, img9);
    			append_dev(div54, t146);
    			append_dev(div54, div50);
    			append_dev(div50, div49);
    			append_dev(div49, p41);
    			append_dev(div49, t148);
    			append_dev(div49, p42);
    			append_dev(div49, t150);
    			append_dev(div49, p43);
    			append_dev(div49, t152);
    			append_dev(div49, p44);
    			append_dev(div49, t153);
    			append_dev(div49, p45);
    			append_dev(div50, t154);
    			append_dev(div50, img10);
    			append_dev(div54, t155);
    			append_dev(div54, p46);
    			append_dev(div54, t157);
    			append_dev(div54, div52);
    			append_dev(div52, div51);
    			append_dev(div51, p47);
    			append_dev(div51, t158);
    			append_dev(div51, p48);
    			append_dev(div51, t159);
    			append_dev(div51, p49);
    			append_dev(div51, t160);
    			append_dev(div51, p50);
    			append_dev(div51, t161);
    			append_dev(div51, p51);
    			append_dev(div52, t162);
    			append_dev(div52, img11);
    			append_dev(div54, t163);
    			append_dev(div54, div53);
    			append_dev(div53, p52);
    			append_dev(div80, t165);
    			append_dev(div80, div63);
    			append_dev(div63, div57);
    			append_dev(div57, div55);
    			append_dev(div57, t167);
    			append_dev(div57, div56);
    			append_dev(div63, t169);
    			append_dev(div63, p53);
    			append_dev(div63, t171);
    			append_dev(div63, div59);
    			append_dev(div59, div58);
    			append_dev(div58, p54);
    			append_dev(div58, t173);
    			append_dev(div58, p55);
    			append_dev(div58, t175);
    			append_dev(div58, p56);
    			append_dev(div58, t177);
    			append_dev(div58, p57);
    			append_dev(div59, t179);
    			append_dev(div59, img12);
    			append_dev(div63, t180);
    			append_dev(div63, div61);
    			append_dev(div61, div60);
    			append_dev(div60, p58);
    			append_dev(div60, t182);
    			append_dev(div60, p59);
    			append_dev(div60, t184);
    			append_dev(div60, p60);
    			append_dev(div60, t186);
    			append_dev(div60, p61);
    			append_dev(div61, t188);
    			append_dev(div61, img13);
    			append_dev(div63, t189);
    			append_dev(div63, div62);
    			append_dev(div62, p62);
    			append_dev(div80, t191);
    			append_dev(div80, div72);
    			append_dev(div72, div66);
    			append_dev(div66, div64);
    			append_dev(div66, t193);
    			append_dev(div66, div65);
    			append_dev(div72, t195);
    			append_dev(div72, p63);
    			append_dev(div72, t197);
    			append_dev(div72, div68);
    			append_dev(div68, div67);
    			append_dev(div67, p64);
    			append_dev(div67, t199);
    			append_dev(div67, p65);
    			append_dev(div67, t201);
    			append_dev(div67, p66);
    			append_dev(div67, t203);
    			append_dev(div67, p67);
    			append_dev(div68, t204);
    			append_dev(div68, img14);
    			append_dev(div72, t205);
    			append_dev(div72, div70);
    			append_dev(div70, div69);
    			append_dev(div69, p68);
    			append_dev(div69, t207);
    			append_dev(div69, p69);
    			append_dev(div69, t209);
    			append_dev(div69, p70);
    			append_dev(div69, t211);
    			append_dev(div69, p71);
    			append_dev(div70, t212);
    			append_dev(div70, img15);
    			append_dev(div72, t213);
    			append_dev(div72, div71);
    			append_dev(div71, p72);
    			append_dev(div80, t214);
    			append_dev(div80, div79);
    			append_dev(div79, div75);
    			append_dev(div75, div73);
    			append_dev(div75, t216);
    			append_dev(div75, div74);
    			append_dev(div79, t218);
    			append_dev(div79, div77);
    			append_dev(div77, div76);
    			append_dev(div76, p73);
    			append_dev(div76, t220);
    			append_dev(div76, br0);
    			append_dev(div76, t221);
    			append_dev(div76, p74);
    			append_dev(div76, t223);
    			append_dev(div76, p75);
    			append_dev(div76, t225);
    			append_dev(div76, br1);
    			append_dev(div76, t226);
    			append_dev(div76, p76);
    			append_dev(div76, t228);
    			append_dev(div76, p77);
    			append_dev(div76, t230);
    			append_dev(div76, br2);
    			append_dev(div76, t231);
    			append_dev(div76, p78);
    			append_dev(div79, t233);
    			append_dev(div79, div78);
    			append_dev(div78, img16);
    			append_dev(div78, t234);
    			append_dev(div78, p79);
    			/*div80_binding*/ ctx[28](div80);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(li0, "click", /*click_handler*/ ctx[19], false, false, false),
    				listen_dev(li1, "click", /*click_handler_1*/ ctx[20], false, false, false),
    				listen_dev(li2, "click", /*click_handler_2*/ ctx[21], false, false, false),
    				listen_dev(li3, "click", /*click_handler_3*/ ctx[22], false, false, false),
    				listen_dev(li4, "click", /*click_handler_4*/ ctx[23], false, false, false),
    				listen_dev(li5, "click", /*click_handler_5*/ ctx[24], false, false, false),
    				listen_dev(li6, "click", /*click_handler_6*/ ctx[25], false, false, false),
    				listen_dev(li7, "click", /*click_handler_7*/ ctx[26], false, false, false),
    				listen_dev(li8, "click", /*click_handler_8*/ ctx[27], false, false, false)
    			];
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(youtube.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(youtube.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(youtube);
    			/*div80_binding*/ ctx[28](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { steps } = $$props;

    	function step(i = 0) {
    		steps.children[i - 1].scrollIntoView({ behavior: "smooth", block: "start" });
    	} //console.log(offset);

    	let daisy = "./images/daisy.png";
    	let secondLayerStuck = "./images/second_layer_stuck.png";
    	let secondLayer = "./images/second_layer.png";
    	let whiteBottomLeft = "./images/white_bottom_left_corner.png";
    	let whiteBottomRow = "./images/white_bottom_row_corner.png";
    	let whiteCross = "./images/white_cross.png";
    	let whiteTopCorner = "./images/white_top_corner.png";
    	let whiteTopFaceCorner = "./images/white_top_face_corner.png";
    	let yellowCrossComplete = "./images/yellow_cross_complete.png";
    	let yellowCrossL = "./images/yellow_cross_l.png";
    	let yellowCrossNoEdge = "./images/yellow_cross_no_edge.png";
    	let yellowCrossStraightLine = "./images/yellow_cross_straight_line.png";
    	let yellowFaceFish = "./images/yellow_face_fish.png";
    	let yellowFaceNoFish = "./images/yellow_face_no_fish.png";
    	let cornersNoMatching = "./images/corners_no_matching.png";
    	let cornersMatching = "./images/corners_matching.png";
    	let finalSolved = "./images/final_solved.png";
    	const writable_props = ["steps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Steps> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Steps", $$slots, []);
    	const click_handler = () => step(1);
    	const click_handler_1 = () => step(2);
    	const click_handler_2 = () => step(3);
    	const click_handler_3 = () => step(4);
    	const click_handler_4 = () => step(5);
    	const click_handler_5 = () => step(6);
    	const click_handler_6 = () => step(7);
    	const click_handler_7 = () => step(8);
    	const click_handler_8 = () => step(9);

    	function div80_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, steps = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("steps" in $$props) $$invalidate(0, steps = $$props.steps);
    	};

    	$$self.$capture_state = () => ({
    		steps,
    		step,
    		Youtube: Src,
    		daisy,
    		secondLayerStuck,
    		secondLayer,
    		whiteBottomLeft,
    		whiteBottomRow,
    		whiteCross,
    		whiteTopCorner,
    		whiteTopFaceCorner,
    		yellowCrossComplete,
    		yellowCrossL,
    		yellowCrossNoEdge,
    		yellowCrossStraightLine,
    		yellowFaceFish,
    		yellowFaceNoFish,
    		cornersNoMatching,
    		cornersMatching,
    		finalSolved
    	});

    	$$self.$inject_state = $$props => {
    		if ("steps" in $$props) $$invalidate(0, steps = $$props.steps);
    		if ("daisy" in $$props) $$invalidate(2, daisy = $$props.daisy);
    		if ("secondLayerStuck" in $$props) $$invalidate(3, secondLayerStuck = $$props.secondLayerStuck);
    		if ("secondLayer" in $$props) $$invalidate(4, secondLayer = $$props.secondLayer);
    		if ("whiteBottomLeft" in $$props) $$invalidate(5, whiteBottomLeft = $$props.whiteBottomLeft);
    		if ("whiteBottomRow" in $$props) $$invalidate(6, whiteBottomRow = $$props.whiteBottomRow);
    		if ("whiteCross" in $$props) $$invalidate(7, whiteCross = $$props.whiteCross);
    		if ("whiteTopCorner" in $$props) $$invalidate(8, whiteTopCorner = $$props.whiteTopCorner);
    		if ("whiteTopFaceCorner" in $$props) $$invalidate(9, whiteTopFaceCorner = $$props.whiteTopFaceCorner);
    		if ("yellowCrossComplete" in $$props) $$invalidate(10, yellowCrossComplete = $$props.yellowCrossComplete);
    		if ("yellowCrossL" in $$props) $$invalidate(11, yellowCrossL = $$props.yellowCrossL);
    		if ("yellowCrossNoEdge" in $$props) $$invalidate(12, yellowCrossNoEdge = $$props.yellowCrossNoEdge);
    		if ("yellowCrossStraightLine" in $$props) $$invalidate(13, yellowCrossStraightLine = $$props.yellowCrossStraightLine);
    		if ("yellowFaceFish" in $$props) $$invalidate(14, yellowFaceFish = $$props.yellowFaceFish);
    		if ("yellowFaceNoFish" in $$props) $$invalidate(15, yellowFaceNoFish = $$props.yellowFaceNoFish);
    		if ("cornersNoMatching" in $$props) $$invalidate(16, cornersNoMatching = $$props.cornersNoMatching);
    		if ("cornersMatching" in $$props) $$invalidate(17, cornersMatching = $$props.cornersMatching);
    		if ("finalSolved" in $$props) $$invalidate(18, finalSolved = $$props.finalSolved);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		steps,
    		step,
    		daisy,
    		secondLayerStuck,
    		secondLayer,
    		whiteBottomLeft,
    		whiteBottomRow,
    		whiteCross,
    		whiteTopCorner,
    		whiteTopFaceCorner,
    		yellowCrossComplete,
    		yellowCrossL,
    		yellowCrossNoEdge,
    		yellowCrossStraightLine,
    		yellowFaceFish,
    		yellowFaceNoFish,
    		cornersNoMatching,
    		cornersMatching,
    		finalSolved,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		div80_binding
    	];
    }

    class Steps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { steps: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Steps",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*steps*/ ctx[0] === undefined && !("steps" in props)) {
    			console.warn("<Steps> was created without expected prop 'steps'");
    		}
    	}

    	get steps() {
    		throw new Error("<Steps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set steps(value) {
    		throw new Error("<Steps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // utility functions used in the project
    // prepend a zero to integers smaller than 10 (used for the second and minute values)
    function zeroPadded(number) {
        return number >= 10 ? number.toString() : `0${number}`;
    }
    // consider the last digit of the input number (used for the tenths of seconds)
    function lastDigit(number) {
        return number.toString()[number.toString().length - 1];
    }

    /* format time in the following format
    mm:ss:t
    zero padded minutes, zero padded seconds, tenths of seconds
    */
    function formatTime(milliseconds) {
        const mm = zeroPadded(Math.floor(milliseconds / 1000 / 60));
        const ss = zeroPadded(Math.floor(milliseconds / 1000) % 60);
        const t = lastDigit(Math.floor(milliseconds / 100));
        return `${mm}:${ss}.${t}`;
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                store.set(target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* src/Timer/Stopwatch.svelte generated by Svelte v3.22.1 */
    const file$3 = "src/Timer/Stopwatch.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let g4;
    	let circle0;
    	let use;
    	let g1;
    	let g0;
    	let path0;
    	let g1_transform_value;
    	let g3;
    	let g2;
    	let path1;
    	let g2_transform_value;
    	let circle1;
    	let circle2;
    	let text_1;
    	let t_value = formatTime(/*lapse*/ ctx[0]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g4 = svg_element("g");
    			circle0 = svg_element("circle");
    			use = svg_element("use");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			g3 = svg_element("g");
    			g2 = svg_element("g");
    			path1 = svg_element("path");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(circle0, "id", "dial");
    			attr_dev(circle0, "cx", "0");
    			attr_dev(circle0, "cy", "0");
    			attr_dev(circle0, "r", "42");
    			attr_dev(circle0, "fill", "none");
    			attr_dev(circle0, "stroke", "currentColor");
    			attr_dev(circle0, "stroke-width", "5");
    			attr_dev(circle0, "stroke-dasharray", "0.3 1.898");
    			add_location(circle0, file$3, 40, 8, 1464);
    			attr_dev(use, "href", "#dial");
    			attr_dev(use, "transform", "scale(-1 1)");
    			add_location(use, file$3, 41, 8, 1601);
    			attr_dev(path0, "d", "M -2.25 0 h 4.5 l -2.25 2.5 l -2.25 -2.5");
    			attr_dev(path0, "fill", "currentColor");
    			attr_dev(path0, "stroke", "currentColor");
    			attr_dev(path0, "stroke-width", "1");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-linecap", "round");
    			add_location(path0, file$3, 48, 16, 1918);
    			attr_dev(g0, "transform", "translate(0 -50)");
    			add_location(g0, file$3, 47, 12, 1869);
    			attr_dev(g1, "transform", g1_transform_value = "rotate(" + /*rotation*/ ctx[3] + ")");
    			add_location(g1, file$3, 46, 8, 1800);
    			attr_dev(path1, "d", "M 0 -1 v -4.5");
    			attr_dev(path1, "fill", "none");
    			attr_dev(path1, "stroke", "currentColor");
    			attr_dev(path1, "stroke-width", "0.4");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-linecap", "round");
    			add_location(path1, file$3, 57, 16, 2408);
    			attr_dev(g2, "transform", g2_transform_value = "rotate(" + /*rotation*/ ctx[3] * 60 % 360 + ")");
    			add_location(g2, file$3, 56, 12, 2322);
    			attr_dev(circle1, "r", "7");
    			attr_dev(circle1, "fill", "none");
    			attr_dev(circle1, "stroke", "currentColor");
    			attr_dev(circle1, "stroke-width", "0.4");
    			add_location(circle1, file$3, 59, 12, 2569);
    			attr_dev(circle2, "r", "1");
    			attr_dev(circle2, "fill", "none");
    			attr_dev(circle2, "stroke", "currentColor");
    			attr_dev(circle2, "stroke-width", "0.4");
    			add_location(circle2, file$3, 60, 12, 2658);
    			attr_dev(g3, "transform", "translate(0 20)");
    			add_location(g3, file$3, 52, 8, 2122);
    			attr_dev(text_1, "text-anchor", "middle");
    			attr_dev(text_1, "fill", "currentColor");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "font-size", "10");
    			set_style(text_1, "font-weight", "300");
    			set_style(text_1, "letter-spacing", "1px");
    			add_location(text_1, file$3, 63, 8, 2757);
    			attr_dev(g4, "transform", "translate(50 50)");
    			add_location(g4, file$3, 39, 4, 1423);
    			attr_dev(svg, "viewBox", "0 0 100 100");
    			attr_dev(svg, "width", "300");
    			attr_dev(svg, "height", "300");
    			attr_dev(svg, "class", "svelte-ugd3ku");
    			add_location(svg, file$3, 38, 0, 1366);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g4);
    			append_dev(g4, circle0);
    			append_dev(g4, use);
    			append_dev(g4, g1);
    			append_dev(g1, g0);
    			append_dev(g0, path0);
    			/*g1_binding*/ ctx[5](g1);
    			append_dev(g4, g3);
    			append_dev(g3, g2);
    			append_dev(g2, path1);
    			/*g2_binding*/ ctx[6](g2);
    			append_dev(g3, circle1);
    			append_dev(g3, circle2);
    			append_dev(g4, text_1);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rotation*/ 8 && g1_transform_value !== (g1_transform_value = "rotate(" + /*rotation*/ ctx[3] + ")")) {
    				attr_dev(g1, "transform", g1_transform_value);
    			}

    			if (dirty & /*rotation*/ 8 && g2_transform_value !== (g2_transform_value = "rotate(" + /*rotation*/ ctx[3] * 60 % 360 + ")")) {
    				attr_dev(g2, "transform", g2_transform_value);
    			}

    			if (dirty & /*lapse*/ 1 && t_value !== (t_value = formatTime(/*lapse*/ ctx[0]) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			/*g1_binding*/ ctx[5](null);
    			/*g2_binding*/ ctx[6](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { lapse = 0 } = $$props;

    	// this is a very imperfect way to have the dials rotate smoothly back to 0
    	// set a transition on the minutes and seconds dial, but only when lapse is set to 0
    	// remove it when lapse is then more than 0
    	let seconds;

    	let minutes;

    	// to avoid constantly setting transition to none add a boolean to short-circuit the second conditional
    	let transitioned;

    	const writable_props = ["lapse"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stopwatch> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Stopwatch", $$slots, []);

    	function g1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, minutes = $$value);
    		});
    	}

    	function g2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, seconds = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("lapse" in $$props) $$invalidate(0, lapse = $$props.lapse);
    	};

    	$$self.$capture_state = () => ({
    		formatTime,
    		tweened,
    		lapse,
    		seconds,
    		minutes,
    		transitioned,
    		rotation
    	});

    	$$self.$inject_state = $$props => {
    		if ("lapse" in $$props) $$invalidate(0, lapse = $$props.lapse);
    		if ("seconds" in $$props) $$invalidate(1, seconds = $$props.seconds);
    		if ("minutes" in $$props) $$invalidate(2, minutes = $$props.minutes);
    		if ("transitioned" in $$props) $$invalidate(4, transitioned = $$props.transitioned);
    		if ("rotation" in $$props) $$invalidate(3, rotation = $$props.rotation);
    	};

    	let rotation;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lapse*/ 1) {
    			// rotation refers to the degrees applied to the minutes dial to have a full rotation for 60 seconds
    			// multiply the value by 60 for the seconds dial to have a full rotation every second
    			 $$invalidate(3, rotation = lapse / 1000 / 60 * 360 % 360);
    		}

    		if ($$self.$$.dirty & /*lapse, minutes, seconds*/ 7) {
    			// minutes and seconds are undefined by default
    			 if (!lapse && minutes && seconds) {
    				$$invalidate(2, minutes.style.transition = "transform 0.2s ease-in-out", minutes);
    				$$invalidate(1, seconds.style.transition = "transform 0.2s ease-in-out", seconds);
    				$$invalidate(4, transitioned = false);
    			}
    		}

    		if ($$self.$$.dirty & /*lapse, transitioned*/ 17) {
    			 if (lapse && !transitioned) {
    				$$invalidate(2, minutes.style.transition = "none", minutes);
    				$$invalidate(1, seconds.style.transition = "none", seconds);
    				$$invalidate(4, transitioned = true);
    			}
    		}
    	};

    	return [lapse, seconds, minutes, rotation, transitioned, g1_binding, g2_binding];
    }

    class Stopwatch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { lapse: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stopwatch",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get lapse() {
    		throw new Error("<Stopwatch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lapse(value) {
    		throw new Error("<Stopwatch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    function flip(node, animation, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src/Timer/Laps.svelte generated by Svelte v3.22.1 */
    const file$4 = "src/Timer/Laps.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (68:4) {#each laps as lap (lap.total)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let h2;
    	let t0;
    	let sup;
    	let t1_value = /*lap*/ ctx[1].number + "";
    	let t1;
    	let t2;
    	let h3;
    	let t3_value = formatTime(/*lap*/ ctx[1].total) + "";
    	let t3;
    	let t4;
    	let h4;
    	let t5;
    	let t6_value = formatTime(/*lap*/ ctx[1].partial) + "";
    	let t6;
    	let t7;
    	let li_intro;
    	let rect;
    	let stop_animation = noop;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			h2 = element("h2");
    			t0 = text("Lap ");
    			sup = element("sup");
    			t1 = text(t1_value);
    			t2 = space();
    			h3 = element("h3");
    			t3 = text(t3_value);
    			t4 = space();
    			h4 = element("h4");
    			t5 = text("+");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(sup, "class", "svelte-1pi3kc0");
    			add_location(sup, file$4, 69, 16, 1844);
    			attr_dev(h2, "class", "svelte-1pi3kc0");
    			add_location(h2, file$4, 69, 8, 1836);
    			attr_dev(h3, "class", "svelte-1pi3kc0");
    			add_location(h3, file$4, 70, 8, 1881);
    			attr_dev(h4, "class", "svelte-1pi3kc0");
    			add_location(h4, file$4, 71, 8, 1922);
    			attr_dev(li, "class", "svelte-1pi3kc0");
    			add_location(li, file$4, 68, 4, 1740);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, h2);
    			append_dev(h2, t0);
    			append_dev(h2, sup);
    			append_dev(sup, t1);
    			append_dev(li, t2);
    			append_dev(li, h3);
    			append_dev(h3, t3);
    			append_dev(li, t4);
    			append_dev(li, h4);
    			append_dev(h4, t5);
    			append_dev(h4, t6);
    			append_dev(li, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*laps*/ 1 && t1_value !== (t1_value = /*lap*/ ctx[1].number + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*laps*/ 1 && t3_value !== (t3_value = formatTime(/*lap*/ ctx[1].total) + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*laps*/ 1 && t6_value !== (t6_value = formatTime(/*lap*/ ctx[1].partial) + "")) set_data_dev(t6, t6_value);
    		},
    		r: function measure() {
    			rect = li.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(li);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(li, rect, flip, { duration: 350 });
    		},
    		i: function intro(local) {
    			if (!li_intro) {
    				add_render_callback(() => {
    					li_intro = create_in_transition(li, fly, { y: -20, duration: 300, delay: 50 });
    					li_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(68:4) {#each laps as lap (lap.total)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*laps*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*lap*/ ctx[1].total;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-1pi3kc0");
    			add_location(ul, file$4, 66, 0, 1695);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*formatTime, laps*/ 1) {
    				const each_value = /*laps*/ ctx[0];
    				validate_each_argument(each_value);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_destroy_block, create_each_block, null, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}
    		},
    		i: function intro(local) {
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { laps = [] } = $$props;
    	const writable_props = ["laps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Laps> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Laps", $$slots, []);

    	$$self.$set = $$props => {
    		if ("laps" in $$props) $$invalidate(0, laps = $$props.laps);
    	};

    	$$self.$capture_state = () => ({ fly, flip, formatTime, laps });

    	$$self.$inject_state = $$props => {
    		if ("laps" in $$props) $$invalidate(0, laps = $$props.laps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [laps];
    }

    class Laps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { laps: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Laps",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get laps() {
    		throw new Error("<Laps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set laps(value) {
    		throw new Error("<Laps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Timer/Controls.svelte generated by Svelte v3.22.1 */
    const file$5 = "src/Timer/Controls.svelte";

    // (71:4) {:else}
    function create_else_block(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Start";
    			attr_dev(button, "class", "svelte-16hiinn");
    			add_location(button, file$5, 71, 4, 2004);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*start*/ ctx[2], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(71:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (68:21) 
    function create_if_block_1(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Continue";
    			attr_dev(button0, "class", "svelte-16hiinn");
    			add_location(button0, file$5, 68, 4, 1898);
    			attr_dev(button1, "class", "svelte-16hiinn");
    			add_location(button1, file$5, 69, 4, 1943);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*stop*/ ctx[3], false, false, false),
    				listen_dev(button1, "click", /*start*/ ctx[2], false, false, false)
    			];
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(68:21) ",
    		ctx
    	});

    	return block;
    }

    // (65:4) {#if subscription}
    function create_if_block(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Lap";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Pause";
    			attr_dev(button0, "class", "svelte-16hiinn");
    			add_location(button0, file$5, 65, 4, 1788);
    			attr_dev(button1, "class", "svelte-16hiinn");
    			add_location(button1, file$5, 66, 4, 1830);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*lap*/ ctx[5], false, false, false),
    				listen_dev(button1, "click", /*pause*/ ctx[4], false, false, false)
    			];
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(65:4) {#if subscription}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*subscription*/ ctx[0]) return create_if_block;
    		if (/*lapsed*/ ctx[1]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "controls svelte-16hiinn");
    			add_location(div, file$5, 63, 0, 1738);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	// following a click on the buttons dispatch the matching events
    	function start() {
    		dispatch("start");
    	}

    	function stop() {
    		dispatch("stop");
    	}

    	function pause() {
    		dispatch("pause");
    	}

    	function lap() {
    		dispatch("lap");
    	}

    	let { subscription } = $$props;
    	let { lapsed } = $$props;
    	const writable_props = ["subscription", "lapsed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Controls", $$slots, []);

    	$$self.$set = $$props => {
    		if ("subscription" in $$props) $$invalidate(0, subscription = $$props.subscription);
    		if ("lapsed" in $$props) $$invalidate(1, lapsed = $$props.lapsed);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		start,
    		stop,
    		pause,
    		lap,
    		subscription,
    		lapsed
    	});

    	$$self.$inject_state = $$props => {
    		if ("subscription" in $$props) $$invalidate(0, subscription = $$props.subscription);
    		if ("lapsed" in $$props) $$invalidate(1, lapsed = $$props.lapsed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [subscription, lapsed, start, stop, pause, lap];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { subscription: 0, lapsed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*subscription*/ ctx[0] === undefined && !("subscription" in props)) {
    			console.warn("<Controls> was created without expected prop 'subscription'");
    		}

    		if (/*lapsed*/ ctx[1] === undefined && !("lapsed" in props)) {
    			console.warn("<Controls> was created without expected prop 'lapsed'");
    		}
    	}

    	get subscription() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subscription(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lapsed() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lapsed(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // set up a readable store which returns the number of milliseconds between the moment the store is subscribed and following an interval
    const time = readable(0, function start(set) {
    	const beginning = new Date();
    	const beginningTime = beginning.getTime();

    	const interval = setInterval(() => {
    		const current = new Date();
    		const currentTime = current.getTime();
    		set(currentTime - beginningTime);
    	}, 10);

    	return function stop() {
    		// ! forcedly set the readable value to 0 before clearing the interval
    		// it seems the store would otherwise retain the last value and the application would stagger from this value straight to 0
    		set(0);
    		clearInterval(interval);
    	};
    });

    /* src/Timer/App2.svelte generated by Svelte v3.22.1 */

    const file$6 = "src/Timer/App2.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;

    	const stopwatch = new Stopwatch({
    			props: { lapse: /*lapse*/ ctx[0] },
    			$$inline: true
    		});

    	const laps_1 = new Laps({
    			props: { laps: /*laps*/ ctx[1] },
    			$$inline: true
    		});

    	const controls = new Controls({
    			props: {
    				subscription: /*subscription*/ ctx[2],
    				lapsed: /*lapsed*/ ctx[3]
    			},
    			$$inline: true
    		});

    	controls.$on("start", /*start*/ ctx[4]);
    	controls.$on("stop", /*stop*/ ctx[5]);
    	controls.$on("pause", /*pause*/ ctx[6]);
    	controls.$on("lap", /*lap*/ ctx[7]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(stopwatch.$$.fragment);
    			t0 = space();
    			create_component(laps_1.$$.fragment);
    			t1 = space();
    			create_component(controls.$$.fragment);
    			attr_dev(div, "class", "stopwatch");
    			add_location(div, file$6, 148, 0, 4448);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(stopwatch, div, null);
    			append_dev(div, t0);
    			mount_component(laps_1, div, null);
    			append_dev(div, t1);
    			mount_component(controls, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const stopwatch_changes = {};
    			if (dirty & /*lapse*/ 1) stopwatch_changes.lapse = /*lapse*/ ctx[0];
    			stopwatch.$set(stopwatch_changes);
    			const laps_1_changes = {};
    			if (dirty & /*laps*/ 2) laps_1_changes.laps = /*laps*/ ctx[1];
    			laps_1.$set(laps_1_changes);
    			const controls_changes = {};
    			if (dirty & /*subscription*/ 4) controls_changes.subscription = /*subscription*/ ctx[2];
    			if (dirty & /*lapsed*/ 8) controls_changes.lapsed = /*lapsed*/ ctx[3];
    			controls.$set(controls_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stopwatch.$$.fragment, local);
    			transition_in(laps_1.$$.fragment, local);
    			transition_in(controls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stopwatch.$$.fragment, local);
    			transition_out(laps_1.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(stopwatch);
    			destroy_component(laps_1);
    			destroy_component(controls);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let lapse = 0;

    	// previous is set to record the time accumulated before the pause button is pressed
    	let previous = 0;

    	// unsubscribe is set to refer to the function used to unsubscribe from the store
    	let unsubscribe;

    	// through the start function pair the lapse variable to the time retrieved from the readable store
    	function start() {
    		// assign the stop function to unsubscribe
    		$$invalidate(9, unsubscribe = time.subscribe(value => {
    			// add the previous value to the current number of milliseconds
    			$$invalidate(0, lapse = value + previous);
    		}));
    	}

    	// through the terminate function unsubscribe from the readable store
    	function terminate() {
    		// check if unsubscribe is truthy (this to cover the situation in which the stop button is pressed after the pause button)
    		if (unsubscribe) {
    			unsubscribe();
    			$$invalidate(9, unsubscribe = null);
    		}
    	}

    	// through the stop function unsubscribe from the readable store and reset the values
    	function stop() {
    		$$invalidate(0, lapse = 0);
    		previous = 0;
    		$$invalidate(1, laps = []);
    		terminate();
    	}

    	// through the pause function unsubscribe from the store and set previous to match the value held by lapse
    	function pause() {
    		previous = lapse;
    		terminate();
    	}

    	// laps refers to an array describing the number of milliseconds after each lap
    	let laps = [];

    	// through the lap function include an object specifying the total and partial number of milliseconds
    	function lap() {
    		const { length } = laps;
    		const total = lapse;

    		// partial referring to the number of milliseconds between the previous (if existing) and current lap
    		const partial = length > 0 ? total - laps[0].total : total;

    		$$invalidate(1, laps = [{ number: length + 1, total, partial }, ...laps]);
    	}

    	// unsubscribe from the store to avoid memory leaks
    	onDestroy(() => {
    		terminate();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App2> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App2", $$slots, []);

    	$$self.$capture_state = () => ({
    		onDestroy,
    		Stopwatch,
    		Laps,
    		Controls,
    		time,
    		lapse,
    		previous,
    		unsubscribe,
    		start,
    		terminate,
    		stop,
    		pause,
    		laps,
    		lap,
    		subscription,
    		lapsed
    	});

    	$$self.$inject_state = $$props => {
    		if ("lapse" in $$props) $$invalidate(0, lapse = $$props.lapse);
    		if ("previous" in $$props) previous = $$props.previous;
    		if ("unsubscribe" in $$props) $$invalidate(9, unsubscribe = $$props.unsubscribe);
    		if ("laps" in $$props) $$invalidate(1, laps = $$props.laps);
    		if ("subscription" in $$props) $$invalidate(2, subscription = $$props.subscription);
    		if ("lapsed" in $$props) $$invalidate(3, lapsed = $$props.lapsed);
    	};

    	let subscription;
    	let lapsed;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*unsubscribe*/ 512) {
    			// describe the booleans to determine the button(s) included in the controls component
    			// subscription refers to the state in which the start button has been pressed
    			// here the subscription is ongoing and the unsubscribe variable holds a truthy value
    			 $$invalidate(2, subscription = !!unsubscribe);
    		}

    		if ($$self.$$.dirty & /*lapse*/ 1) {
    			// lapsed refers to the state in which the subscription  has started and lapse holds a value greater than 0
    			 $$invalidate(3, lapsed = !!lapse);
    		}
    	};

    	return [lapse, laps, subscription, lapsed, start, stop, pause, lap];
    }

    class App2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App2",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.1 */
    const file$7 = "src/App.svelte";

    // (16:27) 
    function create_if_block_1$1(ctx) {
    	let main;
    	let current;
    	const timer = new App2({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(timer.$$.fragment);
    			attr_dev(main, "class", "svelte-12zn8wr");
    			add_location(main, file$7, 16, 0, 254);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(timer, main, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(timer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(16:27) ",
    		ctx
    	});

    	return block;
    }

    // (12:0) {#if page === 'Home'}
    function create_if_block$1(ctx) {
    	let main;
    	let current;
    	const steps = new Steps({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(steps.$$.fragment);
    			attr_dev(main, "class", "svelte-12zn8wr");
    			add_location(main, file$7, 12, 0, 200);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(steps, main, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(steps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(steps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(steps);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(12:0) {#if page === 'Home'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let updating_page;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	function nav_page_binding(value) {
    		/*nav_page_binding*/ ctx[2].call(null, value);
    	}

    	let nav_props = {};

    	if (/*page*/ ctx[0] !== void 0) {
    		nav_props.page = /*page*/ ctx[0];
    	}

    	const nav = new Nav({ props: nav_props, $$inline: true });
    	binding_callbacks.push(() => bind(nav, "page", nav_page_binding));
    	const if_block_creators = [create_if_block$1, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[0] === "Home") return 0;
    		if (/*page*/ ctx[0] === "Timer") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			create_component(nav.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			insert_dev(target, t, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const nav_changes = {};

    			if (!updating_page && dirty & /*page*/ 1) {
    				updating_page = true;
    				nav_changes.page = /*page*/ ctx[0];
    				add_flush_callback(() => updating_page = false);
    			}

    			nav.$set(nav_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(nav, detaching);
    			if (detaching) detach_dev(t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let page;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function nav_page_binding(value) {
    		page = value;
    		$$invalidate(0, page);
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name, Nav, Steps, Timer: App2, page });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, name, nav_page_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { name: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
