import * as mongoose from "mongoose"
interface SanitizeOptions {
    skip: string[]
}
const sanitize_regex = /[^a-zA-Z0-9@,\.\s\+\:]+/g;
export function sanitizeSchema(schema: mongoose.Schema, options?: SanitizeOptions) {
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
export async function sanitizeUpdate(options?: SanitizeOptions) {
    let update  = (this.getUpdate && this.getUpdate() && this.getUpdate() ) || {} ;
    let keys = Object.keys(update);
    let updatePayload:any = {};
    for(let key of keys){
        updatePayload[key] = sanitizeQuery.call(this,update[key], options)
    }    
    this.update({}, updatePayload);

}

export function sanitizeQuery(query:any,options?: SanitizeOptions): any {
    let skip = (options && options.skip) || [];
    skip = (typeof skip === "string") ? [skip] : skip;
    try{
        query = JSON.parse(JSON.stringify(query));
    }catch(e){

    }
    let allUpdateFiels = (typeof query === "object") && (!Array.isArray(query)) ?  Object.keys(query) : [];
    let newQuery:any = {};
    for (let field of allUpdateFiels) {
        newQuery[field] =  skip.includes(field) ? query[field] : sanitizeAnySync(query[field]) ;
    }
    return (allUpdateFiels.length > 0) ? newQuery : query;

}
function sanitizeArraySync(arr: any[]): any[] {
    return (arr && arr.length) ? arr.map(item => sanitizeAnySync(item) ) : arr
}
function sanitizeObjectSync(obj:any):Object{    
  let res = null;
  res = (!res) && obj && obj.toString ? obj: res;
  res = !res && (obj instanceof Date) ? obj : res;
  res = !res ? _sanitizeObjectSync(obj) : res;
  return res;
    
}

function _sanitizeObjectSync(obj:Object):Object{
    for(let key in obj){
        obj[key] = sanitizeAnySync(obj[key])
    }
    return obj;
}

function sanitizeAnySync(obj:any):any{
    let res:any = obj;
    res = typeof res === "string" ? sanitizeStringSync(res) : res;
    res = Array.isArray(res) ? sanitizeArraySync(res) : res;
    res = typeof res === "object" && (!Array.isArray(res)) ? sanitizeObjectSync(res) : res;
    
    return res;
}
function getStringFieldsForSchema(schema: mongoose.Schema): string[] {
    let collectStringFields: string[] = [];

    schema.eachPath((path, type: any) => {

        (type.instance === 'String') && collectStringFields.push(path);
        (type.instance === 'Array') && (type.casterConstructor && (type.casterConstructor.schemaName === "String")) && collectStringFields.push(path);
    });
    return collectStringFields;
}

function getAllFieldsForSchema(schema: mongoose.Schema): string[] {
    let collectStringFields: string[] = [];
    let map:any = {};
    schema.eachPath((path, type: any) => {
        map[path] = true;     
    });
    return Object.keys(map);
}


export async function sanitizeSave(next, options?: SanitizeOptions) {
    let skip = (options && options.skip) || [];
    skip = (typeof skip === "string") ? [skip] : skip;
    let collectAllFields = getAllFieldsForSchema(this.schema);    
    for (let field of collectAllFields) {
        let paths = field.split(".");
        let lastPathArray = paths.splice(-1,1);
        let lastField = lastPathArray[0];
        let obj = this;
        for(let p of paths){
            obj = obj[p];
        }
        obj[lastField] = skip.includes(field) ? obj[lastField] : (sanitizeAnySync(obj[lastField]))
    }
    next();
}
export async function sanitizeStringAsync(str: string | string[]): Promise<string | string[]> {

    str = (typeof str === "string") ? str.replace(sanitize_regex, (match) => {
        return encodeURIComponent(match);
    }) : str;

    str = (str instanceof Array) ? str.map((item) => sanitizeStringSync(item)) : str;

    return str;
}
export function sanitizeStringSync(str: string): string {
    str = (typeof str === "string") ? str.replace(sanitize_regex, (match) => {
        return encodeURIComponent(match);
    }) : str;
    return str;
}