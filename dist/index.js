"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sanitize_regex = /[^a-zA-Z0-9@,\.\s\+\:]+/g;
function sanitizeSchema(schema, options) {
    schema.pre("save", function (next) {
        sanitizeSave.call(this, next, options);
    });
    schema.pre("update", function () {
        sanitizeUpdate.call(this, options);
    });
    schema.pre("updateOne", function () {
        sanitizeUpdate.call(this, options);
    });
    schema.pre("findOneAndUpdate", function () {
        sanitizeUpdate.call(this, options);
    });
    schema.pre("updateMany", function () {
        sanitizeUpdate.call(this, options);
    });
}
exports.sanitizeSchema = sanitizeSchema;
async function sanitizeUpdate(options) {
    let update = (this.getUpdate && this.getUpdate() && this.getUpdate()) || {};
    let keys = Object.keys(update);
    let updatePayload = {};
    for (let key of keys) {
        updatePayload[key] = sanitizeQuery.call(this, update[key], options);
    }
    this.update({}, updatePayload);
}
exports.sanitizeUpdate = sanitizeUpdate;
function sanitizeQuery(query, options) {
    let skip = (options && options.skip) || [];
    skip = (typeof skip === "string") ? [skip] : skip;
    try {
        query = JSON.parse(JSON.stringify(query));
    }
    catch (e) {
    }
    let allUpdateFiels = (typeof query === "object") && (!Array.isArray(query)) ? Object.keys(query) : [];
    let newQuery = {};
    for (let field of allUpdateFiels) {
        newQuery[field] = skip.includes(field) ? query[field] : sanitizeAnySync(query[field]);
    }
    return (allUpdateFiels.length > 0) ? newQuery : query;
}
exports.sanitizeQuery = sanitizeQuery;
function sanitizeArraySync(arr) {
    return (arr && arr.length) ? arr.map(item => sanitizeAnySync(item)) : arr;
}
function sanitizeObjectSync(obj) {
    let res = null;
    res = (!res) && obj && obj.toString ? obj : res;
    res = !res && (obj instanceof Date) ? obj : res;
    res = !res ? _sanitizeObjectSync(obj) : res;
    return res;
}
function _sanitizeObjectSync(obj) {
    for (let key in obj) {
        obj[key] = sanitizeAnySync(obj[key]);
    }
    return obj;
}
function sanitizeAnySync(obj) {
    let res = obj;
    res = typeof res === "string" ? sanitizeStringSync(res) : res;
    res = Array.isArray(res) ? sanitizeArraySync(res) : res;
    res = typeof res === "object" && (!Array.isArray(res)) ? sanitizeObjectSync(res) : res;
    return res;
}
function getStringFieldsForSchema(schema) {
    let collectStringFields = [];
    schema.eachPath((path, type) => {
        (type.instance === 'String') && collectStringFields.push(path);
        (type.instance === 'Array') && (type.casterConstructor && (type.casterConstructor.schemaName === "String")) && collectStringFields.push(path);
    });
    return collectStringFields;
}
function getAllFieldsForSchema(schema) {
    let collectStringFields = [];
    let map = {};
    schema.eachPath((path, type) => {
        map[path] = true;
    });
    return Object.keys(map);
}
async function sanitizeSave(next, options) {
    let skip = (options && options.skip) || [];
    skip = (typeof skip === "string") ? [skip] : skip;
    let collectAllFields = getAllFieldsForSchema(this.schema);
    for (let field of collectAllFields) {
        let paths = field.split(".");
        let lastPathArray = paths.splice(-1, 1);
        let lastField = lastPathArray[0];
        let obj = this;
        for (let p of paths) {
            obj = obj[p];
        }
        obj[lastField] = skip.includes(field) ? obj[lastField] : (sanitizeAnySync(obj[lastField]));
    }
    next();
}
exports.sanitizeSave = sanitizeSave;
async function sanitizeStringAsync(str) {
    str = (typeof str === "string") ? str.replace(sanitize_regex, (match) => {
        return encodeURIComponent(match);
    }) : str;
    str = (str instanceof Array) ? str.map((item) => sanitizeStringSync(item)) : str;
    return str;
}
exports.sanitizeStringAsync = sanitizeStringAsync;
function sanitizeStringSync(str) {
    str = (typeof str === "string") ? str.replace(sanitize_regex, (match) => {
        return encodeURIComponent(match);
    }) : str;
    return str;
}
exports.sanitizeStringSync = sanitizeStringSync;
