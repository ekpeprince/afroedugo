module.exports = [
"[project]/afroedugo/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
exports._ = _interop_require_default;
}),
"[project]/afroedugo/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}
exports._ = _interop_require_wildcard;
}),
"[project]/afroedugo/node_modules/@swc/helpers/cjs/_class_private_field_loose_base.cjs [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

function _class_private_field_loose_base(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
exports._ = _class_private_field_loose_base;
}),
"[project]/afroedugo/node_modules/@swc/helpers/cjs/_class_private_field_loose_key.cjs [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var id = 0;
function _class_private_field_loose_key(name) {
    return "__private_" + id++ + "_" + name;
}
exports._ = _class_private_field_loose_key;
}),
"[project]/afroedugo/node_modules/use-places-autocomplete/dist/index.esm.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>usePlacesAutocomplete,
    "getDetails",
    ()=>getDetails,
    "getGeocode",
    ()=>getGeocode,
    "getLatLng",
    ()=>getLatLng,
    "getZipCode",
    ()=>getZipCode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/afroedugo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
var useLatest = function(val) {
    var ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(val);
    ref.current = val;
    return ref;
};
var _debounce = function(fn, delay) {
    var timer; // eslint-disable-next-line func-names
    return function() {
        var _this = this;
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(function() {
            return fn.apply(_this, args);
        }, delay);
    };
};
var loadApiErr = "💡 use-places-autocomplete: Google Maps Places API library must be loaded. See: https://github.com/wellyshen/use-places-autocomplete#load-the-library";
var usePlacesAutocomplete = function usePlacesAutocomplete(_temp) {
    var _ref = _temp === void 0 ? {} : _temp, requestOptions = _ref.requestOptions, _ref$debounce = _ref.debounce, debounce = _ref$debounce === void 0 ? 200 : _ref$debounce, _ref$cache = _ref.cache, cache = _ref$cache === void 0 ? 24 * 60 * 60 : _ref$cache, _ref$cacheKey = _ref.cacheKey, cacheKey = _ref$cacheKey === void 0 ? "upa" : _ref$cacheKey, googleMaps = _ref.googleMaps, callbackName = _ref.callbackName, _ref$defaultValue = _ref.defaultValue, defaultValue = _ref$defaultValue === void 0 ? "" : _ref$defaultValue, _ref$initOnMount = _ref.initOnMount, initOnMount = _ref$initOnMount === void 0 ? true : _ref$initOnMount;
    var _useState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false), ready = _useState[0], setReady = _useState[1];
    var _useState2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(defaultValue), value = _useState2[0], setVal = _useState2[1];
    var _useState3 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        loading: false,
        status: "",
        data: []
    }), suggestions = _useState3[0], setSuggestions = _useState3[1];
    var asRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    var requestOptionsRef = useLatest(requestOptions);
    var googleMapsRef = useLatest(googleMaps);
    var init = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(function() {
        var _google$maps;
        if (asRef.current) return;
        var _window = window, google = _window.google;
        var gMaps = googleMapsRef.current;
        var placesLib = (gMaps == null ? void 0 : gMaps.places) || (google == null ? void 0 : (_google$maps = google.maps) == null ? void 0 : _google$maps.places);
        if (!placesLib) {
            console.error(loadApiErr);
            return;
        }
        asRef.current = new placesLib.AutocompleteService();
        setReady(true);
    }, [
        googleMapsRef
    ]);
    var clearSuggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(function() {
        setSuggestions({
            loading: false,
            status: "",
            data: []
        });
    }, []);
    var clearCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(function(key) {
        if (key === void 0) {
            key = cacheKey;
        }
        try {
            sessionStorage.removeItem(key);
        } catch (error) {}
    }, [
        cacheKey
    ]); // eslint-disable-next-line react-hooks/exhaustive-deps
    var fetchPredictions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(_debounce(function(val) {
        var _asRef$current;
        if (!val) {
            clearSuggestions();
            return;
        }
        setSuggestions(function(prevState) {
            return _extends({}, prevState, {
                loading: true
            });
        });
        var cachedData = {};
        try {
            cachedData = JSON.parse(sessionStorage.getItem(cacheKey) || "{}");
        } catch (error) {}
        if (cache) {
            cachedData = Object.keys(cachedData).reduce(function(acc, key) {
                if (cachedData[key].maxAge - Date.now() >= 0) acc[key] = cachedData[key];
                return acc;
            }, {});
            if (cachedData[val]) {
                setSuggestions({
                    loading: false,
                    status: "OK",
                    data: cachedData[val].data
                });
                return;
            }
        }
        (_asRef$current = asRef.current) == null ? void 0 : _asRef$current.getPlacePredictions(_extends({}, requestOptionsRef.current, {
            input: val
        }), function(data, status) {
            setSuggestions({
                loading: false,
                status: status,
                data: data || []
            });
            if (cache && status === "OK") {
                cachedData[val] = {
                    data: data,
                    maxAge: Date.now() + cache * 1000
                };
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(cachedData));
                } catch (error) {}
            }
        });
    }, debounce), [
        cache,
        cacheKey,
        clearSuggestions,
        requestOptionsRef
    ]);
    var setValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(function(val, shouldFetchData) {
        if (shouldFetchData === void 0) {
            shouldFetchData = true;
        }
        setVal(val);
        if (asRef.current && shouldFetchData) fetchPredictions(val);
    }, [
        fetchPredictions
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$afroedugo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(function() {
        if (!initOnMount) return function() {
            return null;
        };
        var _window2 = window, google = _window2.google;
        if (!googleMapsRef.current && !(google != null && google.maps) && callbackName) {
            window[callbackName] = init;
        } else {
            init();
        }
        return function() {
            // @ts-ignore
            if (window[callbackName]) delete window[callbackName];
        };
    }, [
        callbackName,
        googleMapsRef,
        init,
        initOnMount
    ]);
    return {
        ready: ready,
        value: value,
        suggestions: suggestions,
        setValue: setValue,
        clearSuggestions: clearSuggestions,
        clearCache: clearCache,
        init: init
    };
};
/* eslint-disable compat/compat */ var geocodeErr = "💡 use-places-autocomplete: Please provide an address when using getGeocode() with the componentRestrictions.";
var getGeocode = function getGeocode(args) {
    var geocoder = new window.google.maps.Geocoder();
    return new Promise(function(resolve, reject) {
        geocoder.geocode(args, function(results, status) {
            if (status !== "OK") reject(status);
            if (!args.address && args.componentRestrictions) {
                console.error(geocodeErr);
                resolve(results);
            }
            resolve(results);
        });
    });
};
var getLatLng = function getLatLng(result) {
    var _result$geometry$loca = result.geometry.location, lat = _result$geometry$loca.lat, lng = _result$geometry$loca.lng;
    return {
        lat: lat(),
        lng: lng()
    };
};
var getZipCode = function getZipCode(result, useShortName) {
    var foundZip = result.address_components.find(function(_ref) {
        var types = _ref.types;
        return types.includes("postal_code");
    });
    if (!foundZip) return undefined;
    return useShortName ? foundZip.short_name : foundZip.long_name;
};
var getDetailsErr = "💡 use-places-autocomplete: Please provide a place Id when using getDetails() either as a string or as part of an Autocomplete Prediction.";
var getDetails = function getDetails(args) {
    var PlacesService = new window.google.maps.places.PlacesService(document.createElement("div"));
    if (!args.placeId) {
        console.error(getDetailsErr);
        return Promise.reject(getDetailsErr);
    }
    return new Promise(function(resolve, reject) {
        PlacesService.getDetails(args, function(results, status) {
            if (status !== "OK") reject(status);
            resolve(results);
        });
    });
};
;
 //# sourceMappingURL=index.esm.js.map
}),
];

//# sourceMappingURL=5a802_3c59a971._.js.map