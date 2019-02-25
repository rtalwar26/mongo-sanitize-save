# Mongo Sanitize

Sanitizes string fields before saving/updating a document into a mongo collection.


## Usage

```javascript
const mongoose = require("mongoose");
const sanitize = require("monogo-sanitize-save");

let Schema = mongoose.Schema;
let inner_schema = new Schema({
    inner_name: {type:String},
    inner_title:{type:Number},
    date:{type:Date}
    
});
let outer_schema = new Schema({
    title:{type:String},
    subtitle:{type:String},
    str_array: [{ type: String,required: true}],
    details: [inner_schema]
    
});

sanitize.sanitizeSchema(outer_schema);
sanitize.sanitizeSchema(inner_schema);

exports.default = mongoose.model('my_collection', outer_schema);
```