/*eslint-disable*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = {};

export const test = $root.test = (() => {

    /**
     * Namespace test.
     * @exports test
     * @namespace
     */
    const test = {};

    test.test_c = (function() {

        /**
         * Properties of a test_c.
         * @memberof test
         * @interface Itest_c
         * @property {number|Long|null} [__id] test_c __id
         * @property {number|null} [__sequence] test_c __sequence
         * @property {string|null} [data] test_c data
         */

        /**
         * Constructs a new test_c.
         * @memberof test
         * @classdesc Represents a test_c.
         * @implements Itest_c
         * @constructor
         * @param {test.Itest_c=} [properties] Properties to set
         */
        function test_c(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * test_c __id.
         * @member {number|Long} __id
         * @memberof test.test_c
         * @instance
         */
        test_c.prototype.__id = $util.Long ? $util.Long.fromBits(1,0,false) : 1;

        /**
         * test_c __sequence.
         * @member {number} __sequence
         * @memberof test.test_c
         * @instance
         */
        test_c.prototype.__sequence = 0;

        /**
         * test_c data.
         * @member {string} data
         * @memberof test.test_c
         * @instance
         */
        test_c.prototype.data = "";

        /**
         * Creates a new test_c instance using the specified properties.
         * @function create
         * @memberof test.test_c
         * @static
         * @param {test.Itest_c=} [properties] Properties to set
         * @returns {test.test_c} test_c instance
         */
        test_c.create = function create(properties) {
            return new test_c(properties);
        };

        /**
         * Encodes the specified test_c message. Does not implicitly {@link test.test_c.verify|verify} messages.
         * @function encode
         * @memberof test.test_c
         * @static
         * @param {test.Itest_c} message test_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test_c.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.__id != null && Object.hasOwnProperty.call(message, "__id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.__id);
            if (message.__sequence != null && Object.hasOwnProperty.call(message, "__sequence"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.__sequence);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.data);
            return writer;
        };

        /**
         * Encodes the specified test_c message, length delimited. Does not implicitly {@link test.test_c.verify|verify} messages.
         * @function encodeDelimited
         * @memberof test.test_c
         * @static
         * @param {test.Itest_c} message test_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test_c.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a test_c message from the specified reader or buffer.
         * @function decode
         * @memberof test.test_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {test.test_c} test_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test_c.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.test_c();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.__id = reader.int64();
                        break;
                    }
                case 2: {
                        message.__sequence = reader.int32();
                        break;
                    }
                case 3: {
                        message.data = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a test_c message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof test.test_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {test.test_c} test_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test_c.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a test_c message.
         * @function verify
         * @memberof test.test_c
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        test_c.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.__id != null && message.hasOwnProperty("__id"))
                if (!$util.isInteger(message.__id) && !(message.__id && $util.isInteger(message.__id.low) && $util.isInteger(message.__id.high)))
                    return "__id: integer|Long expected";
            if (message.__sequence != null && message.hasOwnProperty("__sequence"))
                if (!$util.isInteger(message.__sequence))
                    return "__sequence: integer expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isString(message.data))
                    return "data: string expected";
            return null;
        };

        /**
         * Creates a test_c message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof test.test_c
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {test.test_c} test_c
         */
        test_c.fromObject = function fromObject(object) {
            if (object instanceof $root.test.test_c)
                return object;
            let message = new $root.test.test_c();
            if (object.__id != null)
                if ($util.Long)
                    (message.__id = $util.Long.fromValue(object.__id)).unsigned = false;
                else if (typeof object.__id === "string")
                    message.__id = parseInt(object.__id, 10);
                else if (typeof object.__id === "number")
                    message.__id = object.__id;
                else if (typeof object.__id === "object")
                    message.__id = new $util.LongBits(object.__id.low >>> 0, object.__id.high >>> 0).toNumber();
            if (object.__sequence != null)
                message.__sequence = object.__sequence | 0;
            if (object.data != null)
                message.data = String(object.data);
            return message;
        };

        /**
         * Creates a plain object from a test_c message. Also converts values to other types if specified.
         * @function toObject
         * @memberof test.test_c
         * @static
         * @param {test.test_c} message test_c
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        test_c.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(1, 0, false);
                    object.__id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.__id = options.longs === String ? "1" : 1;
                object.__sequence = 0;
                object.data = "";
            }
            if (message.__id != null && message.hasOwnProperty("__id"))
                if (typeof message.__id === "number")
                    object.__id = options.longs === String ? String(message.__id) : message.__id;
                else
                    object.__id = options.longs === String ? $util.Long.prototype.toString.call(message.__id) : options.longs === Number ? new $util.LongBits(message.__id.low >>> 0, message.__id.high >>> 0).toNumber() : message.__id;
            if (message.__sequence != null && message.hasOwnProperty("__sequence"))
                object.__sequence = message.__sequence;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this test_c to JSON.
         * @function toJSON
         * @memberof test.test_c
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        test_c.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for test_c
         * @function getTypeUrl
         * @memberof test.test_c
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        test_c.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/test.test_c";
        };

        return test_c;
    })();

    return test;
})();

export { $root as default };
