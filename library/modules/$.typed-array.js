'use strict';
var DEBUG = true;

var global            = require('./$.global')
  , $def              = require('./$.def')
  , $buffer           = require('./$.buffer')
  , $ArrayBuffer      = $buffer.ArrayBuffer
  , $DataView         = $buffer.DataView
  , $                 = require('./$')
  , setDesc           = $.setDesc
  , getDesc           = $.getDesc
  , strictNew         = require('./$.strict-new')
  , propertyDesc      = require('./$.property-desc')
  , $hide             = require('./$.hide')
  , isInteger         = require('./$.is-integer')
  , toInteger         = require('./$.to-integer')
  , toLength          = require('./$.to-length')
  , toIndex           = require('./$.to-index')
  , isObject          = require('./$.is-object')
  , toObject          = require('./$.to-object')
  , isIterable        = require('./core.is-iterable')
  , TYPED_ARRAY       = require('./$.wks')('_typed')
  , arrayMethods      = require('./$.array-methods')
  , arrayIncludes     = require('./$.array-includes')
  , $fill             = require('./$.array-fill')
  , $copyWithin       = require('./$.array-copy-within')
  , $forEach          = arrayMethods(0)
  , $map              = arrayMethods(1)
  , $filter           = arrayMethods(2)
  , $some             = arrayMethods(3)
  , $every            = arrayMethods(4)
  , $find             = arrayMethods(5)
  , $findIndex        = arrayMethods(6)
  , $indexOf          = arrayIncludes(false)
  , $includes         = arrayIncludes(true)
  , $lastIndexOf      = [].lastIndexOf
  , $reduce           = [].reduce
  , $reduceRight      = [].reduceRight
  , $join             = [].join
  , $reverse          = [].reverse
  , $sort             = [].sort
  , $slice            = [].slice
  , $toString         = [].toString
  , $toLocaleString   = [].toLocaleString
  , BYTES_PER_ELEMENT = 'BYTES_PER_ELEMENT';

var validate = function(it){
  if(isObject(it) && TYPED_ARRAY in it)return it;
  throw TypeError(it + ' is not TypedArray!');
};

var fromList = function(C, list){
  var index  = 0
    , length = list.length
    , result = new C(length);
  while(length > index)result[index] = list[index++];
  return result;
};

var $from = function from(source /*, mapfn, thisArg */){
  return fromList(this, isIterable(source) ? Array.from(source) : source); // TODO
};

var addGetter = function(C, key, internal){
  setDesc(C.prototype, key, {get: function(){ return this._d[internal]; }});
};

var statics = {
  // @@species -> this
  from: $from,
  of: function of(/*...items*/){
    var index  = 0
      , length = arguments.length
      , result = new this(length);
    while(length > index)result[index] = arguments[index++];
    return result;
  }
};

var proto = {
  // get length
  // constructor
  copyWithin: function copyWithin(target, start /*, end */){
    return $copyWithin.call(validate(this), target, start, arguments[2]);
  },
  every: function every(callbackfn /*, thisArg */){
    return $every(validate(this), callbackfn, arguments[1]);
  },
  fill: function fill(value /*, start, end */){
    return $fill.call(validate(this), value, arguments[1], arguments[2]);
  },
  filter: function filter(callbackfn /*, thisArg */){
    return fromList(this.constructor, $filter(validate(this), callbackfn, arguments[1])); // TMP
  },
  find: function find(predicate /*, thisArg */){
    return $find(validate(this), predicate, arguments[1]);
  },
  findIndex: function findIndex(predicate /*, thisArg */){
    return $findIndex(validate(this), predicate, arguments[1]);
  },
  forEach: function forEach(callbackfn /*, thisArg */){
    $forEach(validate(this), callbackfn, arguments[1]);
  },
  indexOf: function indexOf(searchElement /*, fromIndex */){
    return $indexOf(validate(this), searchElement, arguments[1]);
  },
  includes: function includes(searchElement /*, fromIndex */){
    return $includes(validate(this), searchElement, arguments[1]);
  },
  join: function join(separator){
    return $join.apply(validate(this), arguments);
  },
  lastIndexOf: function lastIndexOf(searchElement /*, fromIndex */){ // eslint-disable-line
    return $lastIndexOf.apply(validate(this), arguments);
  },
  map: function map(mapfn /*, thisArg */){
    return fromList(this.constructor, $map(validate(this), mapfn, arguments[1])); // TMP
  },
  reduce: function reduce(callbackfn /*, initialValue */){ // eslint-disable-line
    return $reduce.apply(validate(this), arguments);
  },
  reduceRight: function reduceRight(callbackfn /*, initialValue */){ // eslint-disable-line
    return $reduceRight.apply(validate(this), arguments);
  },
  reverse: function reverse(){
    return $reverse.call(validate(this));
  },
  set: function set(arrayLike /*, offset */){
    validate(this);
    var offset = toInteger(arguments[1]);
    if(offset < 0)throw RangeError();
    var length = this.length;
    var src    = toObject(arrayLike);
    var index  = 0;
    var len    = toLength(src.length);
    if(len + offset > length)throw RangeError();
    while(index < len)this[offset + index] = src[index++];
  },
  slice: function slice(start, end){
    return fromList(this.constructor, $slice.call(validate(this), start, end)); // TODO
  },
  some: function some(callbackfn /*, thisArg */){
    return $some(validate(this), callbackfn, arguments[1]);
  },
  sort: function sort(comparefn){
    return $sort.call(validate(this), comparefn);
  },
  subarray: function subarray(/* begin, end */){
    var O      = validate(this)
      , length = O.length
      , begin  = toIndex(arguments[0], length)
      , end    = arguments[1];
    return new O.constructor( // <- TODO SpeciesConstructor
      O.buffer,
      O.byteOffset + begin * O.BYTES_PER_ELEMENT,
      toLength((end === undefined ? length : toIndex(end, length)) - begin)
    );
  },
  toLocaleString: function toLocaleString(){
    return $toLocaleString.apply(validate(this), arguments);
  },
  toString: function toString(){
    return $toString.call(validate(this));
  },
  entries: function entries(){
    // looks like Array equal + ValidateTypedArray
  },
  keys: function keys(){
    // looks like Array equal + ValidateTypedArray
  },
  values: function values(){
    // looks like Array equal + ValidateTypedArray
  },
  // @@iterator
};

var isTADesc = function(target, key){
  return isObject(target) && TYPED_ARRAY in target
    && (typeof key == 'string' || typeof key == 'number') && isInteger(+key);
};
var $getDesc = $.getDesc = function getOwnPropertyDescriptor(target, key){
  return isTADesc(target, key) ? propertyDesc(2, target[key]) : getDesc(target, key);
};
var $setDesc = $.setDesc = function defineProperty(target, key, desc){
  if(isTADesc(target, key) && isObject(desc)){
    if('value' in desc)target[key] = desc.value;
    return target;
  } else return setDesc(target, key, desc);
};

$def($def.S + $def.F * DEBUG, 'Object', {
  getOwnPropertyDescriptor: $getDesc,
  defineProperty: $setDesc
});

DEBUG && ('Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,' +
'Uint32Array,Float32Array,Float64Array').split(',').forEach(function(it){
  delete global[it];
});

module.exports = function(TYPE, BYTES, wrapper){
  var NAME         = TYPE + 'Array'
    , $cre         = /Clamped/
    , KEY          = TYPE.replace($cre, '')
    , GETTER       = 'get' + KEY
    , SETTER       = 'set' + KEY
    , CLAMPED      = $cre.test(NAME)
    , $TypedArray  = global[NAME]
    , Base         = $TypedArray
    , O            = {};
  var addElement = function(that, index){
    setDesc(that, index, {
      get: function(){
        var data = this._d;
        return data.v[GETTER](index * BYTES + data.o);
      },
      set: function(it){
        var data = this._d;
        if(CLAMPED)it = (it = Math.round(it)) < 0 ? 0 : it > 0xff ? 0xff : it & 0xff;
        data.v[SETTER](index * BYTES + data.o, it);
      },
      enumerable: true
    });
  }
  if(!$ArrayBuffer)return;
  if(!$TypedArray || !$buffer.useNative){
    $TypedArray = wrapper(function(that, data, $offset, $length){
      strictNew(that, $TypedArray, NAME);
      var index  = 0
        , offset = 0
        , buffer, byteLength, length;
      if(!isObject(data)){
        byteLength = toInteger(data) * BYTES;
        buffer = new $ArrayBuffer(byteLength);
      // TODO TA case
      } else if(data instanceof $ArrayBuffer){
        buffer = data;
        offset = toInteger($offset);
        if(offset < 0 || offset % BYTES)throw RangeError();
        var $len = data.byteLength;
        if($length === undefined){
          if($len % BYTES)throw RangeError();
          byteLength = $len - offset;
          if(byteLength < 0)throw RangeError();
        } else {
          byteLength = toLength($length) * BYTES;
          if(byteLength + offset > $len)throw RangeError();
        }
      } else return $from.call($TypedArray, data);
      length = byteLength / BYTES;
      $hide(that, '_d', {
        b: buffer,
        o: offset,
        l: byteLength,
        e: length,
        v: new $DataView(buffer)
      });
      while(index < length)addElement(that, index++);
    });
    addGetter($TypedArray, 'buffer', 'b');
    addGetter($TypedArray, 'byteOffset', 'o');
    addGetter($TypedArray, 'byteLength', 'l');
    addGetter($TypedArray, 'length', 'e');
    $hide($TypedArray, BYTES_PER_ELEMENT, BYTES);
    $hide($TypedArray.prototype, BYTES_PER_ELEMENT, BYTES);
  } else if(!require('./$.iter-detect')(function(iter){ new $TypedArray(iter); })){
    $TypedArray = wrapper(function(that, data, $offset, $length){
      strictNew(that, $TypedArray, NAME);
      if(isObject(it) && isIterable(it))return $from.call($TypedArray, data);
      return new $TypedArray(data, $offset, $length);
    });
    $TypedArray.prototype = Base.prototype;
  }
  $hide($TypedArray.prototype, TYPED_ARRAY, true);
  DEBUG && require('./$.mix')($TypedArray.prototype, proto);
  DEBUG && require('./$.mix')($TypedArray, statics);
  O[NAME] = $TypedArray;
  $def($def.G + $def.F * ($TypedArray != Base), O);
};