(async () => {
    const safeGets = (obj, ks) => ks.split('.').reduce((a, b) => (a || {})[b], obj);
    const safeSets = (obj, ks, v) => {
        const _ks = ks.split('.');
        const length = _ks.length;
        _ks.slice(0, length - 1).reduce((a, b) => a[b] || (a[b] = {}), obj)[_ks[length - 1]] = v;
    };
    const cacheDo = (() => {
        const Map = {};
        return async (id, fn) => await Map[id] || (Map[id] = fn());
    })();
    const dd = (msg, key) => {
        const keyLen = key.length / 2;
        const keyMap = new Array(keyLen).fill(0).reduce((a, _, index) => (a[key[index]] = key[index + keyLen], a), {});
        return msg.split('').map(i => keyMap[i]).join('');
    };
    const ptbk = async id => await cacheDo(id, _ => document.querySelector('.index-trend-view').__vue__.$axios.get("/Interface/ptbk", { params: { uniqid: id } }));
    const _ptbk = async (obj, vK, idK) => safeSets(obj, vK, dd(safeGets(obj, vK), (await ptbk(safeGets(obj, idK)))['data']));

    const Map = [];
    const MapMap = [];
    MapMap[0] = '资讯指数';
    Map[0] = word => document.querySelector('.index-trend-view').__vue__.$axios.get("/api/FeedSearchApi/getFeedIndex", {
        params: { area: 0, days: 30, word: JSON.stringify([ [{"name": word,"wordType": 1}], ]) }
    }).then(async res => {
        await _ptbk(res, 'data.index.0.data', 'data.uniqid');
        return res;
    });

    MapMap[1] = '搜索指数';
    Map[1] = word => document.querySelector('.index-trend-view').__vue__.$axios.get("/api/SearchApi/index", {
        params: { area: "0", days: 30, word: JSON.stringify([ [{"name": word,"wordType": 1}], ]) }
    }).then(async res => {
        await _ptbk(res, 'data.userIndexes.0.all.data', 'data.uniqid');
        await _ptbk(res, 'data.userIndexes.0.pc.data', 'data.uniqid');
        await _ptbk(res, 'data.userIndexes.0.wise.data', 'data.uniqid');
        return res;
    });

    MapMap[2] = '需求图谱';
    Map[2] = word => document.querySelector('.index-trend-view').__vue__.$axios.get("/api/WordGraph/multi", {
        params: { wordlist: [word], datelist: [] }
    });

    MapMap[3] = '地域分布';
    Map[3] = word => document.querySelector('.index-trend-view').__vue__.$axios.get("/api/SearchApi/region", {
        params: { region: 0, word: word, days: 30 }
    });

    MapMap[4] = '人群属性';
    Map[4] = word => document.querySelector('.index-trend-view').__vue__.$axios.get("/api/SocialApi/baseAttributes", {
        params: { wordlist: word }
    });

    MapMap[5] = '兴趣分布';
    Map[5] = word => document.querySelector('.index-trend-view').__vue__.$axios.get("/api/SocialApi/interest", {
        params: { wordlist: [word], typeid: '' }
    });

    const delayCall = (fn, tFn) => (...args) => new Promise(async resolve => {
        setTimeout(async () => resolve(await fn.apply(null, args)), tFn());
    });

    const queryWords = async (output, words) => {
        output.push(await _queryWord(words[0]));
        return await words.length > 1 ? queryWords(output, words.slice(1)) : output;
    };
    const queryWord = async word => {
        return await Promise.all([
            Map[0](word),
            Map[1](word),
            Map[2](word),
            Map[3](word),
            Map[4](word),
            Map[5](word)
        ]);
        //const output = [];
        //output[0] = await Map[0](word);
        //output[1] = await Map[1](word);
        //output[2] = await Map[2](word);
        //output[3] = await Map[3](word);
        //output[4] = await Map[4](word);
        //output[5] = await Map[5](word);
        //return output;
    }
    const _queryWord = delayCall(queryWord, _ => 500 + Math.random() * 500);

    const state = {
        isRuning: false,
        words: [],
        output: []
    };

    const readTextFile = (file) => new Promise(function(resolve) {
        const f = new FileReader();
        f.readAsText(file);
        f.onload = function() {
            resolve(f.result);
        }
    });

    const canvas = document.createElement('div');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '999';
    canvas.style.background = 'rgba(13, 67, 24, 0.5)';
    canvas.style.transition = 'transform 1s';
    canvas.style.transform = 'scale(0)';
    canvas.innerHTML = `<h5 style="display: inline-block; font-size: 30px; color: #fff; background: #000; padding: 10px; margin: 50% auto; font-style: italic;"></h5>`;
    document.body.appendChild(canvas);

    const _canvas = document.createElement('div');
    _canvas.style.position = 'fixed';
    _canvas.style.bottom = '20px';
    _canvas.style.left = '20px';
    _canvas.style.width = '50px';
    _canvas.style.height = '50px';
    _canvas.style.zIndex = '999';
    _canvas.style.cursor = 'pointer';
    _canvas.style.background = '#66ccff';
    _canvas.style.transition = 'transform 1s';
    _canvas.style.transform = 'scale(1)';
    _canvas.style.display = 'none';
    _canvas.innerHTML = `<input type="file" style="left: 0; top: 0; cursor: pointer; opacity: 0; position: absolute; width: 100%; height: 100%;">`;
    document.body.appendChild(_canvas);

    const startState = async words => {
        state.words = words;
        state.output = [];
        state.isRuning = true;
        canvas.style.transform = 'scale(1)';
        _canvas.style.transform = 'scale(0)';
        await queryWords(state.output, state.words);
    };

    const endState = () => {
        state.isRuning = false;
        canvas.style.transform = 'scale(0)';
        _canvas.style.transform = 'scale(1)';
        console.log(MapMap, state.words, state.output);
    };

    _canvas.children[0].onchange = async () => {
        const wordsTxt = await readTextFile(_canvas.children[0].files[0]);
        const words = wordsTxt.split('\n').filter(i => !!i);
        words.length && await startState(words);
    };

    const loop = () => {
        if(state.isRuning) {
            const x = state.words.length - state.output.length;
            canvas.children[0].innerText = x;
            x === 0 && endState();
        }
        requestAnimationFrame(loop);
    };
    loop();

    const _loop = () => {
        const x = safeGets(document.querySelector('.index-trend-view'), '__vue__.$axios.get');
        !!x ? _canvas.style.display = 'block' : requestAnimationFrame(_loop);
    }
    _loop();
})();
